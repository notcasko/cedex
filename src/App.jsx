// src/App.jsx
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon } from "lucide-react";
import LZString from "lz-string";

// Categories (8th uses special: 'generate')
const categories = [
  { id: 1, label: "Bond CEs", flag: "svtEquipFriendShip" },
  { id: 2, label: "Chocolate", flag: "svtEquipChocolate" },
  { id: 3, label: "Commemorative", flag: "svtEquipCampaign" },
  { id: 4, label: "Normal", flag: "normal", raritySplit: true },
  { id: 5, label: "Event gacha", flag: "svtEquipEvent", raritySplit: true },
  { id: 6, label: "Event free", flag: "svtEquipEventReward", raritySplit: true },
  { id: 7, label: "Manaprism exchange", flag: "svtEquipManaExchange", raritySplit: true },
  { id: 8, label: "Export data", special: "generate" },
];

// example subcategories for chocolate / commemorative (edit later)
const commemorativeSubcategories = [
  { label: "2nd Anni", range: [594, 640] },
  { label: "3rd Anni", range: [819, 857] },
];
const chocolateSubcategories = [
  { label: "2016 Valentine", range: [113, 153] },
  { label: "2017 Valentine", range: [430, 544] },
];

// simple persisted state hook
const usePersistedState = (key, initial) => {
  const [state, setState] = useState(() => {
    try {
      const s = localStorage.getItem(key);
      return s ? JSON.parse(s) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {}
  }, [key, state]);
  return [state, setState];
};

export default function App() {
  const searchInputRef = useRef(null);
  const [theme, setTheme] = usePersistedState("theme", "dark");
  const [active, setActive] = useState(null); // active category object
  const [collection, setCollection] = usePersistedState("collection", {}); // id -> true
  const [lookingFor, setLookingFor] = usePersistedState("lookingFor", {}); // id -> true map
  const [offering, setOffering] = usePersistedState("offering", {}); // id -> true map

  // NEW persisted flags and lastId
  const [lastId, setLastId] = usePersistedState("lastId", "");
  const [offerAll, setOfferAll] = usePersistedState("offerAll", false);
  const [lookingAll, setLookingAll] = usePersistedState("lookingAll", false);

  // selection mode in opened window: 'none' | 'looking' | 'offering'
  const [selectionMode, setSelectionMode] = useState("none");

  // viewer/read-only mode (decoded from URL hash #/view/<userId>/<encoded>)
  const [isViewingShared, setIsViewingShared] = useState(false);
  const [sharedUserId, setSharedUserId] = useState("");
  const [viewCollection, setViewCollection] = useState({});
  const [viewLookingFor, setViewLookingFor] = useState({});
  const [viewOffering, setViewOffering] = useState({});

  // search
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  // highlight id used for pulsing border (we'll still keep a small state for UI reasons)
  const [highlightId, setHighlightId] = useState(null);

  // generate modal state
  const [genUserId, setGenUserId] = useState("");
  const [generatedUrl, setGeneratedUrl] = useState("");

  const [data, setCollectionData] = useState([]);

  useEffect(() => {
    fetch("https://api.atlasacademy.io/export/JP/basic_equip_lang_en.json")
      .then((res) => res.json())
      .then((data) => setCollectionData(data));
  }, []);

  // refs
  const modalRef = useRef(null);

  // ESC closes modal or exits shared view
  useEffect(() => {
  const onKey = (e) => {
    if (e.key === "Escape") {
      // If search is active, clear it first
      if (query) {
        setQuery("");
        setResults([]);
        return; // don’t close modals yet
      }

      // existing ESC logic
      if (isViewingShared) {
        exitViewerMode();
      } else {
        setActive(null);
        setSelectionMode("none");
      }
    }
  };
  window.addEventListener("keydown", onKey);
  return () => window.removeEventListener("keydown", onKey);
}, [query, isViewingShared]);

  useEffect(() => {
    const onKey = (e) => {
      // ignore if typing in an input/textarea already
      const tag = document.activeElement.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "Escape") return;

      // ignore if modal/window is active
      if (active) return;

      // focus the search input
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  // decode shared link from hash: #/view/<userId>/<encoded>
  useEffect(() => {
    const tryDecode = () => {
      const hash = window.location.hash || "";
      if (!hash.startsWith("#/view/")) return;
      const parts = hash.split("/");
      if (parts.length < 4) return;
      const uid = parts[2];
      const compressed = parts.slice(3).join("/"); // everything after uid

      try {
        const json = LZString.decompressFromEncodedURIComponent(compressed);
        const decoded = JSON.parse(json);
        // expected shape: { collection: [ids], lookingFor: [ids] or "ALL", offering: [ids] or "ALL" }
        const cArr = Array.isArray(decoded.collection) ? decoded.collection : [];
        const lf = decoded.lookingFor;
        const of = decoded.offering;
        const cm = {}; const lfm = {}; const ofm = {};
        cArr.forEach(id => cm[String(id)] = true);
        if (lf === "ALL") {
          // mark special sentinel
          setViewLookingFor("ALL");
        } else {
          (Array.isArray(lf) ? lf : []).forEach(id => lfm[String(id)] = true);
          setViewLookingFor(lfm);
        }
        if (of === "ALL") {
          setViewOffering("ALL");
        } else {
          (Array.isArray(of) ? of : []).forEach(id => ofm[String(id)] = true);
          setViewOffering(ofm);
        }

        setIsViewingShared(true);
        setSharedUserId(uid);
        setViewCollection(cm);
        setActive(null);
    } catch (err) {
      console.warn("Failed to decode shared link:", err);
    }
  };
    tryDecode();
    window.addEventListener("hashchange", tryDecode);
    return () => window.removeEventListener("hashchange", tryDecode);
  }, []);

  const searchRef = useRef(null);
  // Close search dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setResults([]);
      }
    };
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  const mapOwned = (id) => (isViewingShared ? !!viewCollection[id] : !!collection[id]);

  const getProgress = () => {
    const total = data.length;
    const owned = isViewingShared
      ? (typeof viewCollection === "object" ? Object.values(viewCollection).filter(Boolean).length : 0)
      : Object.values(collection).filter(Boolean).length;
    return { owned, total };
  };

  const getCategoryProgress = (cat) => {
    const items = getItems(cat);
    if (!items.length) return { owned: 0, total: 0 };
    const owned = items.filter(it => mapOwned(it.id)).length;
    const total = items.length;
    return { owned, total, percentage: total ? Math.round((owned / total) * 100) : 0 };
  };

  // toggle interactions: when selectionMode is active, clicking an item toggles that list; otherwise toggles owned
  const onItemClick = (item) => {
    if (isViewingShared) return; // read-only
    if (selectionMode === "looking") {
      setLookingFor(prev => {
        const copy = { ...prev };
        if (copy[item.id]) delete copy[item.id];
        else copy[item.id] = true;
        return copy;
      });
      pulse(item.id);
      return;
    }
    if (selectionMode === "offering") {
      setOffering(prev => {
        const copy = { ...prev };
        if (copy[item.id]) delete copy[item.id];
        else copy[item.id] = true;
        return copy;
      });
      pulse(item.id);
      return;
    }
    // normal owned toggle
    setCollection(prev => ({ ...prev, [item.id]: !prev[item.id] }));
    pulse(item.id);
  };
  const getCategoryPercentage = (cat) => {
    const items = getItems(cat);
    if (!items.length) return 0;
    const ownedCount = items.filter(it => mapOwned(it.id)).length;
    return Math.round((ownedCount / items.length) * 100);
  };

  const markAll = (items, value) => {
    if (isViewingShared) return;
    setCollection(prev => {
      const copy = { ...prev };
      items.forEach(it => copy[it.id] = value);
      return copy;
    });
  };

  const getItems = (cat) => {
    if (!data || !data.length) return [];
    if (cat.flag === "normal") {
      // many normals have item.flag === 'normal' OR flags === []
      return data.filter(it => it.flag === "normal" || !Array.isArray(it.flags) || it.flags.length === 0);
    }
    if (cat.flag) {
      return data.filter(it => it.flag === cat.flag || (Array.isArray(it.flags) && it.flags.includes(cat.flag)));
    }
    if (cat.range) {
      return data.filter(it => it.collectionNo >= cat.range[0] && it.collectionNo <= cat.range[1]);
    }
    return [];
  };

  // uniform CE cell (ensures consistent layout and bottom-right badge)
  const CECell = ({ item }) => {
    const owned = mapOwned(item.id);
    const isPulse = highlightId === item.id;
    return (
      <div id={`ce-${item.id}`} key={item.id} className={`relative w-[72px] h-[72px] ${isPulse ? "pulse-border" : ""}`}>
        <img
          src={item.face}
          alt={item.name}
          title={item.name}
          className={`w-full h-full object-contain cursor-pointer transition ${owned ? "opacity-100" : "opacity-50"}`}
          onClick={() => onItemClick(item)}
          style={{ pointerEvents: isViewingShared ? "none" : "auto" }}
        />
        <span className="absolute bottom-0 right-0 text-[14px] leading-none bg-black/60 text-white px-1 rounded">
          {item.collectionNo}
        </span>
      </div>
    );
  };

  // pulse/highlight helper (restarts CSS animation immediately by touching DOM)
  const pulse = (id) => {
    // quick state set for accessibility or other logic
    setHighlightId(id);
    // directly manipulate DOM to restart the animation immediately and allow parallel plays
    const el = document.getElementById(`ce-${id}`);
    if (el) {
      // remove class, force reflow, re-add class so animation restarts every time
      el.classList.remove("pulse-border");
      // force reflow
      // eslint-disable-next-line no-unused-expressions
      void el.offsetWidth;
      el.classList.add("pulse-border");
    }
    // also clear highlightId after animation duration (optional)
    setTimeout(() => setHighlightId(null), 1800);
  };

  // search logic
  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }
    const q = query.toLowerCase();
    const qNum = Number(query); // try numeric match
    const filtered = data.filter(it =>
      (it.name && it.name.toLowerCase().includes(q)) ||
      (it.originalName && it.originalName.toLowerCase().includes(q)) ||
      (!isNaN(qNum) && it.collectionNo === qNum) // search by collectionNo
    );
    setResults(filtered.slice(0, 50));
  }, [query]);

  // when user clicks a search result: open the card it belongs to, scroll it into view and pulse
  const onSearchSelect = (item) => {
    // find category that contains this item
    const matched = categories.find(cat => {
      if (cat.flag === "normal") return item.flag === "normal" || (!Array.isArray(item.flags) || item.flags.length === 0);
      if (cat.flag) return item.flag === cat.flag || (Array.isArray(item.flags) && item.flags.includes(cat.flag));
      return false;
    }) || categories[0];

    setActive(matched);
    setSelectionMode("none");

    // scroll into view
    const scrollDelay = 550; // approximate smooth scroll duration
    setTimeout(() => {
      const el = document.getElementById(`ce-${item.id}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        pulse(item.id);

        // trigger flash after scroll is done
        if (!isViewingShared) {
          setTimeout(() => {
            setCollection(prev => ({ ...prev, [item.id]: !prev[item.id] }));
            setTimeout(() => {
              setCollection(prev => ({ ...prev, [item.id]: !prev[item.id] }));
            }, 500);
          }, scrollDelay); // flash starts after scrolling
        }
      }
    }, 50); // tiny delay to ensure modal is active

    setQuery("");
    setResults([]);
  };

  // generate link: compress arrays into base64 JSON (small)
  const generateLink = (uid) => {
    const ownedArr = Object.keys(collection).filter(k => collection[k]);
    const lfArr = Object.keys(lookingFor).filter(k => lookingFor[k]);
    const ofArr = Object.keys(offering).filter(k => offering[k]);

    const payload = {
      collection: ownedArr,
      lookingFor: lookingAll ? "ALL" : lfArr,
      offering: offerAll ? "ALL" : ofArr,
    };

    const json = JSON.stringify(payload);

    const compressed = LZString.compressToEncodedURIComponent(json);

    return `${window.location.origin}/#/view/${uid}/${compressed}`;
  };

  const exitViewerMode = () => {
    setIsViewingShared(false);
    setSharedUserId("");
    setViewCollection({});
    setViewLookingFor({});
    setViewOffering({});
  };

  // small helpers for rendering sections
  const renderGrid = (items) => (
    <div className="flex-1 p-4 overflow-auto">
      <div className="grid grid-cols-10 gap-1">
        {items.map(it => <CECell key={it.id} item={it} />)}
      </div>
    </div>
  );

  const renderItemsWithHeaders = (items, chunkSize = 50) => {
    const chunks = [];
    for (let i = 0; i < items.length; i += chunkSize) {
      chunks.push({
        header: `${i + 1}-${Math.min(i + chunkSize, items.length)}`,
        cards: items.slice(i, i + chunkSize),
      });
    }

    return (
      <div className="flex-1 p-4 overflow-auto">
        {chunks.map((c, idx) => {
          const allComplete = c.cards.every((item) => mapOwned(item.id));
          return (
            <div key={idx}>
              <h3 className="text-lg font-bold my-2 text-black dark:text-white">{c.header}</h3>
              {!isViewingShared && (
                <p
                  className="text-sm text-blue-500 hover:underline cursor-pointer mb-2"
                  onClick={() => markAll(c.cards, !allComplete)}
                >
                  {allComplete ? "Undo this subcategory" : "Complete this subcategory"}
                </p>
              )}
              <div className="grid grid-cols-10 gap-1 mb-6">
                {c.cards.map((it) => (
                  <CECell key={it.id} item={it} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderWithSubcategories = (items, subs) => {
    const used = new Set();
    return (
      <div className="flex-1 p-4 overflow-auto">
        {subs.map((sub, idx) => {
          const subItems = items.filter(it => it.collectionNo >= sub.range[0] && it.collectionNo <= sub.range[1]);
          subItems.forEach(si => used.add(si.id));
          const allComplete = subItems.length > 0 && subItems.every(it => mapOwned(it.id));
          return (
            <div key={idx}>
              <h3 className="text-lg font-bold my-2 text-black dark:text-white">{sub.label}</h3>
              {!isViewingShared && (
                <p className="text-sm text-blue-500 hover:underline cursor-pointer mb-2" onClick={() => markAll(subItems, !allComplete)}>
                  {allComplete ? "Undo this subcategory" : "Complete this subcategory"}
                </p>
              )}
              <div className="grid grid-cols-10 gap-1 mb-6">
                {subItems.map(it => <CECell key={it.id} item={it} />)}
              </div>
            </div>
          );
        })}
        {/* The rest */}
        {(() => {
          const rest = items.filter(it => !used.has(it.id));
          if (!rest.length) return null;
          const allComplete = rest.every(it => mapOwned(it.id));
          return (
            <div>
              <h3 className="text-lg font-bold my-2 text-black dark:text-white">The rest</h3>
              {!isViewingShared && (
                <p className="text-sm text-blue-500 hover:underline cursor-pointer mb-2" onClick={() => markAll(rest, !allComplete)}>
                  {allComplete ? "Undo this subcategory" : "Complete this subcategory"}
                </p>
              )}
              <div className="grid grid-cols-10 gap-1 mb-6">
                {rest.map(it => <CECell key={it.id} item={it} />)}
              </div>
            </div>
          );
        })()}
      </div>
    );
  };

  const renderByRarity = (items) => {
    const rarities = [5, 4, 3, 2, 1];
    return (
      <div className="flex-1 p-4 overflow-auto">
        {rarities.map((r) => {
          const subs = items.filter((it) => it.rarity === r);
          if (!subs.length) return null;
          const allComplete = subs.every((item) => mapOwned(item.id));
          return (
            <div key={r}>
              <h3 className="text-lg font-bold my-2 text-black dark:text-white">
                Rarity {r}
              </h3>
              {!isViewingShared && (
                <p
                  className="text-sm text-blue-500 hover:underline cursor-pointer mb-2"
                  onClick={() => markAll(subs, !allComplete)}
                >
                  {allComplete ? "Undo this subcategory" : "Complete this subcategory"}
                </p>
              )}
              <div className="grid grid-cols-10 gap-1 mb-6">
                {subs.map((it) => (
                  <CECell key={it.id} item={it} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // small list for Generate preview / viewer read-only
  // clicking items in generate preview will remove them from lists (only in normal mode and only when it's an explicit list)
  const SmallList = ({ map, listName, expandAll }) => {
    // map can be:
    // - an object map { id: true }
    // - the string "ALL"
    let ids = [];
    if (map === "ALL") {
      // expand according to expandAll value
      if (expandAll === "offering") {
        ids = Object.keys(collection).filter(k => collection[k]);
      } else if (expandAll === "looking") {
        ids = data.map(d => String(d.id)).filter(id => !collection[id]);
      } else {
        ids = [];
      }
    } else {
      ids = Object.keys(map || {}).filter(k => map[k]);
    }

    if (!ids.length) return <div className="text-sm text-gray-500">none</div>;
    return (
      <>
        <p className="text-xs text-gray-500 mb-1">{ids.length} items</p>
        <div className="grid grid-cols-6 gap-2">
          {ids.map(id => {
            const item = data.find(d => String(d.id) === String(id));
            if (!item) return null;
            return (
              <div
                key={id}
                className={`flex items-center gap-2 p-1 bg-white/5 rounded ${map === "ALL" ? "" : "cursor-pointer hover:bg-white/10"}`}
                onClick={() => {
                  if (isViewingShared) return;
                  // if map === "ALL", don't remove - this is a global flag; user asked to display everything
                  if (map === "ALL") return;
                  if (listName === "looking") {
                    setLookingFor(prev => { const copy = { ...prev }; delete copy[id]; return copy; });
                  } else if (listName === "offering") {
                    setOffering(prev => { const copy = { ...prev }; delete copy[id]; return copy; });
                  }
                  // visual pulse on related CE
                  const el = document.getElementById(`ce-${id}`);
                  if (el) {
                    el.classList.remove("pulse-border");
                    void el.offsetWidth;
                    el.classList.add("pulse-border");
                  }
                }}
              >
                <div className="relative w-12 h-12"> {/* 12 * 4 = 48px */}
                  <img src={item.face} alt={item.name} className="w-full h-full object-contain" />
                  <span className="absolute bottom-0 right-0 text-[10px] bg-black/60 text-white px-1 rounded">{item.collectionNo}</span>
                </div>
                <div className="text-sm">{item.name}</div>
              </div>
            );
          })}
        </div>
      </>
    );
  };

  // UI
  return (
    <div className={theme === "dark" ? "dark bg-gray-900 text-white min-h-screen" : "bg-white text-black min-h-screen"}>
      {/* pulse CSS */}
      <style>{`
        .pulse-border { animation: pulseBorder 1.2s ease-in-out; border-radius: 6px; }
        @keyframes pulseBorder {
          0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.95); }
          50% { box-shadow: 0 0 12px 6px rgba(59, 130, 246, 0.18); }
          100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
        }
      `}</style>

      {/* Header: title, search, theme + viewer banner */}
      <div className="p-4 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">
          CEdex ({getProgress().owned}/{getProgress().total})
        </h1>

        <div className="flex-1 max-w-xl">
          <div className="relative">
            <div ref={searchRef} className="relative">
              <input
                ref={searchInputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name or ID..."
                className="w-full px-4 py-2 rounded-xl border dark:border-gray-600 bg-white dark:bg-gray-800 text-black dark:text-white"
              />
              {results.length > 0 && (
                <div className="absolute z-50 top-full left-0 right-0 bg-white dark:bg-gray-700 rounded-xl shadow-lg max-h-96 overflow-auto mt-2">
                  {results.map(item => (
                    <div key={item.id} className="flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer" onClick={() => onSearchSelect(item)}>
                      <div className="relative w-12 h-12 flex-shrink-0">
                        <img src={item.face} alt={item.name} className={`w-12 h-12 object-contain ${mapOwned(item.id) ? "opacity-100" : "opacity-50"}`} />
                        <span className="absolute bottom-0 right-0 text-[10px] leading-none bg-black/60 text-white px-1 rounded">{item.collectionNo}</span>
                      </div>
                      <div className="text-sm text-black dark:text-white">{item.name}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isViewingShared && (
            <div className="bg-amber-300 dark:bg-amber-600 text-black dark:text-white px-3 py-1 rounded-xl text-sm font-semibold">
              Viewing {sharedUserId} (read-only)
            </div>
          )}
          <button className="px-4 py-2 rounded-xl bg-blue-500 text-white hover:bg-blue-600 transition" onClick={() => setTheme(t => t === "light" ? "dark" : "light")}>
            {theme === "light" ? <Moon /> : <Sun />}
          </button>
        </div>
      </div>

      {/* Main cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 min-h-[50vh]">
        {categories.map(cat => (
          <div key={cat.id} className="relative bg-gray-100 dark:bg-gray-700 rounded-2xl shadow cursor-pointer hover:shadow-lg transition h-[250px] flex items-center justify-center" 
              onClick={() => { setActive(cat); setSelectionMode("none"); }}>
            
            <img src={`/${cat.label.replace(/\s+/g,"_")}.png`} 
                alt="" 
                className="absolute inset-0 w-full h-full object-cover rounded-2xl opacity-40" 
                onError={(e)=> e.currentTarget.style.display='none'} 
            />

            <span className={theme === "dark" ? "relative text-4xl font-bold text-center [text-shadow:2px_2px_3px_black]" : "relative text-3xl font-bold text-center [text-shadow:1px_1px_3px_white]"}>
              {cat.label}
            </span>

            {/* Category progress percentage */}
            {cat.special !== "generate" && (
              <span className={theme === "dark" ? "absolute bottom-2 right-2 text-2xl font-bold [text-shadow:2px_2px_3px_black]" : "absolute bottom-2 right-2 text-2xl font-bold"}>
                {getCategoryPercentage(cat)}%
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Expanded modal */}
      <AnimatePresence>
        {active && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 flex justify-center items-center z-50" onClick={(e) => { if (e.target === e.currentTarget) { setActive(null); setSelectionMode("none"); } }}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-11/12 h-5/6 overflow-hidden flex">
              {/* Sidebar */}
              <div className="w-1/4 p-4 border-r dark:border-gray-700 flex flex-col gap-3">
                <h2 className="text-xl font-bold">{active.label}</h2>

                {/* Only show mark-all and selection buttons for non-generate and when not in view-only */}
                {active.special !== "generate" && !isViewingShared && ( 
                  <>
                    <button className="px-4 py-2 rounded-xl bg-green-500 text-white" onClick={() => markAll(getItems(active), true)}>Mark all have</button>
                    <button className="px-4 py-2 rounded-xl bg-yellow-500 text-white" onClick={() => markAll(getItems(active), false)}>Mark all don't have</button>

                    {/* new buttons below - same blue color */}
                    <button className={`px-4 py-2 rounded-xl ${selectionMode === "looking" ? "bg-blue-500 text-white" : "bg-blue-100 text-black"}`} onClick={() => setSelectionMode(s => s === "looking" ? "none" : "looking")}>
                      Looking for
                    </button>
                    <button className={`px-4 py-2 rounded-xl ${selectionMode === "offering" ? "bg-blue-500 text-white" : "bg-blue-100 text-black"}`} onClick={() => setSelectionMode(s => s === "offering" ? "none" : "offering")}>
                      Offering
                    </button> 
                  </>
                )}

                {/* Paste last ID button - visible for everyone but placed above Close */}
                {active.special === "generate" && lastId && !isViewingShared && (
                  <button
                    className="px-4 py-2 rounded-xl bg-purple-500 text-white"
                    onClick={() => setGenUserId(lastId)}
                  >
                    Paste in last ID {lastId}
                  </button>
                )}

                <button className="px-4 py-2 rounded-xl bg-red-500 text-white" onClick={() => { setActive(null); setSelectionMode("none"); }}>
                  Close
                </button>
                
                {active.special !== "generate" && (
                  <div className="mt-1 font-semibold text-black dark:text-white">
                    Category progress: {getCategoryProgress(active).owned}/{getCategoryProgress(active).total}
                  </div>
                )}
              </div>

              {/* Main content */}
              {/* Generate special handling */}
              {active.special === "generate" ? (
                <div className="flex-1 p-6 overflow-auto text-black dark:text-white bg-white dark:bg-gray-800">
                  {/* If viewing shared, show their lists only */}
                  {isViewingShared ? (
                    <>
                      <h3 className="text-lg font-bold mb-2">Looking for {viewLookingFor === "ALL" ? `(${data.filter(d => !viewCollection[d.id]).length} items)` : ""}</h3>
                      <SmallList map={viewLookingFor} listName="looking" expandAll="looking" />
                      <h3 className="text-lg font-bold mt-4 mb-2">Offering {viewOffering === "ALL" ? `(${Object.keys(viewCollection).filter(k => viewCollection[k]).length} items)` : ""}</h3>
                      <SmallList map={viewOffering} listName="offering" expandAll="offering" />
                      <div className="mt-6 font-semibold">
                        Overall progress: {getProgress().owned}/{getProgress().total}
                      </div>
                      <p className="mt-4 text-sm text-gray-400">Viewing only — controls are hidden.</p>
                    </>
                  ) : (
                    <>
                      <h2 className="text-lg font-bold mb-2">Share Your Collection</h2>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Enter your 9 or 12 digit ID, then click <strong>Generate Hash</strong> to create a shareable link (the payload includes owned + looking/offering arrays OR the special \"ALL\" flag).</p>

                      <input type="text" value={genUserId} onChange={e => setGenUserId(e.target.value.replace(/[^\d]/g,''))} className="w-full p-2 mb-3 rounded border dark:bg-gray-700" placeholder="123456789" />

                      <div className="flex gap-2 mb-3">
                        <button className="px-4 py-2 rounded-xl bg-blue-500 text-white" onClick={() => {
                          if (!/^(?:\d{9}|\d{12})$/.test(genUserId)) { alert('ID must be 9 or 12 digits'); return; }
                          // set lastId
                          setLastId(genUserId);
                          // generate
                          const url = generateLink(genUserId);
                          setGeneratedUrl(url);
                          try { navigator.clipboard.writeText(url); } catch {}
                        }}>
                          Generate Hash
                        </button>
                        <button className="px-4 py-2 rounded-xl bg-gray-300" onClick={() => { setGenUserId(''); setGeneratedUrl(''); }}>
                          Clear
                        </button>
                      </div>

                      {/* Offer all / Looking all toggles */}
                      <div className="flex gap-3 mb-4">
                        <button className={`px-3 py-2 rounded-xl ${offerAll ? "bg-blue-600 text-white" : "bg-blue-200 text-black"}`} onClick={() => { setOfferAll(v => !v); if (!offerAll) setOffering({}); }}>
                          {offerAll ? "Undo Offer Everything" : "Offer everything I have"}
                        </button>
                        <button className={`px-3 py-2 rounded-xl ${lookingAll ? "bg-blue-600 text-white" : "bg-blue-200 text-black"}`} onClick={() => { setLookingAll(v => !v); if (!lookingAll) setLookingFor({}); }}>
                          {lookingAll ? "Undo Looking for Everything" : "Looking for everything I don't have"}
                        </button>
                      </div>

                      {generatedUrl && (
                        <div
                          className="mt-4 p-3 bg-green-100 dark:bg-green-900 rounded-xl cursor-pointer hover:bg-green-200 dark:hover:bg-green-800 transition"
                          onClick={() => {
                            navigator.clipboard.writeText(generatedUrl);
                            alert("Link copied to clipboard!");
                          }}
                        >
                          <p className="text-sm font-semibold mb-1">Your link:</p>
                          <p className="break-all text-sm text-green-700 dark:text-green-300">
                            {generatedUrl}
                          </p>
                        </div>
                      )}
                      
                      {/* hint box restored */}
                      <div className="mt-6 p-3 bg-yellow-100 dark:bg-yellow-800 rounded-xl text-sm">
                        <p className="mb-1 font-semibold">Tips:</p>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>You can click items in the preview to remove them from explicit lists.</li>
                          <li>Paste your 9/12 digit ID or drag a text onto this window (if supported).</li>
                          <li>Generated link contains arrays of IDs or the special \"ALL\" token for compactness.</li>
                        </ul>
                      </div>

                      <div className="mt-6">
                        <h4 className="font-bold">Preview: Looking for {lookingAll ? `(${data.filter(d => !collection[d.id]).length} items)` : ""}</h4>
                        <SmallList map={lookingAll ? "ALL" : lookingFor} listName="looking" expandAll="looking" />
                        <h4 className="font-bold mt-3">Preview: Offering {offerAll ? `(${Object.keys(collection).filter(k => collection[k]).length} items)` : ""}</h4>
                        <SmallList map={offerAll ? "ALL" : offering} listName="offering" expandAll="offering" />
                      </div>  

                      {/* Add overall progress */}
                      <div className="mt-6 font-semibold">
                        Overall progress: {getProgress().owned}/{getProgress().total}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                // non-generate content: choose correct renderer based on category props
                (() => {
                  // Bond CEs: use chunk headers like other earlier design (chunk by 50)
                  if (active.label === "Bond CEs") {
                    const items = getItems(active).sort((a,b)=>a.collectionNo-b.collectionNo);
                    return renderItemsWithHeaders(items);
                  }

                  // Chocolate and Commemorative: use user-defined subcategories + rest
                  if (active.label === "Chocolate") {
                    const items = getItems(active).sort((a,b)=>a.collectionNo-b.collectionNo);
                    return renderWithSubcategories(items, chocolateSubcategories);
                  }
                  if (active.label === "Commemorative") {
                    const items = getItems(active).sort((a,b)=>a.collectionNo-b.collectionNo);
                    return renderWithSubcategories(items, commemorativeSubcategories);
                  }

                  // rarity-split categories
                  if (active.raritySplit) {
                    const items = getItems(active).sort((a,b)=>a.collectionNo-b.collectionNo);
                    return renderByRarity(items);
                  }

                  // default grid
                  const items = getItems(active).sort((a,b)=>a.collectionNo-b.collectionNo);
                  return renderGrid(items);
                })()
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
