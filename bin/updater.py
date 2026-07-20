import requests
import json
import os
import time

# --- Configuration ---
SCRIPT_DIR = os.path.dirname(os.path.realpath(__file__))
BOND_JSON_PATH = os.path.join(SCRIPT_DIR, '..', 'src', 'data', 'bond_ces.json')

ALL_CES_URL = "https://api.atlasacademy.io/export/JP/basic_equip_lang_en.json"
CE_API_URL = "https://api.atlasacademy.io/nice/JP/equip/{}"
SERVANT_EXPORT_URL = "https://api.atlasacademy.io/export/JP/basic_servant_lang_en.json"
SERVANT_EXPORT_CACHE = "basic_servant_lang_en.json"
SERVANT_EXPORT_TTL = 60 * 60 * 24

MASH_CHOCO_IDS = [113, 761, 1195, 1383, 1563, 1795, 2019, 2207, 2582]

# --- Logic ---

def ensure_servant_export(force_refresh=False):
    def cache_is_fresh(path):
        try:
            m = os.path.getmtime(path)
            return (time.time() - m) < SERVANT_EXPORT_TTL
        except OSError:
            return False

    if force_refresh or not cache_is_fresh(SERVANT_EXPORT_CACHE):
        try:
            resp = requests.get(SERVANT_EXPORT_URL, stream=True, timeout=30)
            resp.raise_for_status()
            with open(SERVANT_EXPORT_CACHE + ".tmp", "wb") as fh:
                for chunk in resp.iter_content(chunk_size=1 << 16):
                    if chunk:
                        fh.write(chunk)
            os.replace(SERVANT_EXPORT_CACHE + ".tmp", SERVANT_EXPORT_CACHE)
        except Exception:
            if not os.path.exists(SERVANT_EXPORT_CACHE):
                raise

    with open(SERVANT_EXPORT_CACHE, "r", encoding="utf-8") as fh:
        data = json.load(fh)

    # Stores dict with name, owner_jp (originalName), and face
    id_to_data = {}
    for item in data:
        s_id = item.get("id")
        if s_id is not None:
            id_to_data[int(s_id)] = {
                "name": item.get("name"),
                "owner_jp": item.get("originalName"),
                "face": item.get("face")
            }
    return id_to_data

_SERVANT_MAP = None
def get_servant_map(force_refresh=False):
    global _SERVANT_MAP
    if _SERVANT_MAP is None or force_refresh:
        _SERVANT_MAP = ensure_servant_export(force_refresh=force_refresh)
    return _SERVANT_MAP

def load_existing_bonds():
    try:
        with open(BOND_JSON_PATH, 'r', encoding='utf-8') as f:
            data = json.load(f)
            if not data: return [], set(), 0
            known_ids = {item.get('id') for item in data}
            last_known_id = data[-1].get('id', 0) if data else 0
            return data, known_ids, last_known_id
    except (FileNotFoundError, json.JSONDecodeError):
        return [], set(), 0

def fetch_all_ces():
    response = requests.get(ALL_CES_URL)
    response.raise_for_status()
    return response.json()

def find_new_bond_ces(all_ces, known_ids, last_known_id):
    bond_ces = [ce for ce in all_ces if ce.get('flag') == 'svtEquipFriendShip']
    bond_ces.sort(key=lambda x: x.get('collectionNo', 0))
    
    new_ces = []
    for ce in bond_ces:
        ce_id = ce.get('collectionNo')
        if ce_id > last_known_id and ce_id not in known_ids:
            new_ces.append(ce_id)
    return new_ces

def get_owner_data(ce_id):
    """Returns dict containing servant id, name, owner_jp, face."""
    api_url = CE_API_URL.format(ce_id)
    try:
        resp = requests.get(api_url, timeout=15)
        resp.raise_for_status()
        data = resp.json()
    except Exception as e:
        print(f"ERROR fetching CE {ce_id}: {e}")
        return None

    owner_field = data.get("bondEquipOwner")
    if owner_field is None:
        return None

    owner_id = None
    if isinstance(owner_field, dict):
        owner_id = owner_field.get("id") or owner_field.get("collectionNo")
    elif isinstance(owner_field, (int, str)):
        owner_id = int(owner_field)

    if owner_id:
        servant_map = get_servant_map()
        s_data = servant_map.get(owner_id)
        if s_data:
            return {
                "id": owner_id,
                "name": s_data["name"],
                "owner_jp": s_data["owner_jp"],
                "face": s_data["face"]
            }

    return None

def build_valentine_map(all_ces):
    """Creates a mapping of Servant ID -> Valentine CE ID or List of IDs."""
    val_map = {}
    for ce in all_ces:
        if ce.get('flag') == 'svtEquipChocolate':
            owner_id = ce.get('valentineEquipOwner')
            if owner_id:
                ce_id = ce.get('collectionNo')
                if owner_id in val_map:
                    if isinstance(val_map[owner_id], list):
                        val_map[owner_id].append(ce_id)
                    else:
                        val_map[owner_id] = [val_map[owner_id], ce_id]
                else:
                    val_map[owner_id] = ce_id
    return val_map

def format_entry(entry, servant_map, valentine_map):
    """Formats a single Bond CE entry with correct key order, owner_jp, and choco_id."""
    owner_id = entry.get("owner_id")
    owner_name = entry.get("owner")
    
    # Mash Kyrielight Special Case
    is_mash = (owner_name == "Mash Kyrielight" or owner_id == 1)

    s_data = servant_map.get(owner_id) if owner_id else None
    owner_jp = s_data.get("owner_jp") if s_data else entry.get("owner_jp")

    choco_id = entry.get("choco_id")
    if is_mash:
        choco_id = MASH_CHOCO_IDS
    elif owner_id and owner_id in valentine_map:
        choco_id = valentine_map[owner_id]

    formatted = {
        "id": entry["id"]
    }
    if owner_id is not None:
        formatted["owner_id"] = owner_id
    
    formatted["owner"] = owner_name
    if owner_jp:
        formatted["owner_jp"] = owner_jp
    formatted["face"] = entry.get("face")
    
    if choco_id is not None:
        formatted["choco_id"] = choco_id

    return formatted

def main():
    existing_data, known_ids, last_known_id = load_existing_bonds()
    all_ces = fetch_all_ces()
    servant_map = get_servant_map()
    valentine_map = build_valentine_map(all_ces)
    
    # --- Part 1: Process and update all existing entries ---
    print("Updating existing entries with Japanese names and choco IDs...")
    updated_entries = []
    
    for entry in existing_data:
        # Fetch owner_id via API if missing
        if "owner_id" not in entry:
            owner_info = get_owner_data(entry["id"])
            if owner_info:
                entry["owner_id"] = owner_info["id"]
                entry["owner"] = owner_info["name"]
                entry["owner_jp"] = owner_info["owner_jp"]
                entry["face"] = owner_info["face"]
            time.sleep(0.1)

        formatted = format_entry(entry, servant_map, valentine_map)
        updated_entries.append(formatted)

    # --- Part 2: Find entirely new servants/Bond CEs ---
    new_ce_ids = find_new_bond_ces(all_ces, known_ids, last_known_id)
    new_entries = []
    
    if new_ce_ids:
        print(f"Processing {len(new_ce_ids)} new servants...")
        for ce_id in new_ce_ids:
            owner_info = get_owner_data(ce_id)
            if owner_info:
                raw_entry = {
                    "id": ce_id,
                    "owner_id": owner_info["id"],
                    "owner": owner_info["name"],
                    "owner_jp": owner_info["owner_jp"],
                    "face": owner_info["face"]
                }
                formatted = format_entry(raw_entry, servant_map, valentine_map)
                new_entries.append(formatted)
                print(f"Added: {owner_info['name']}")
            time.sleep(0.5)

    # --- Part 3: Combine and Save results ---
    final_data = updated_entries + new_entries
    final_data.sort(key=lambda x: x.get('id', 0))

    with open(BOND_JSON_PATH, 'w', encoding='utf-8') as f:
        json.dump(final_data, f, indent=2, ensure_ascii=False)
        
    print(f"Done! Saved {len(final_data)} total entries ({len(new_entries)} new added).")

if __name__ == "__main__":
    main()