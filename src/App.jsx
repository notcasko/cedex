import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon, ArrowUpNarrowWide, ArrowDownNarrowWide, ZoomIn } from "lucide-react";
import LZString from "lz-string";

const categories = [
  { id: 1, label: "Bond CEs", flag: "svtEquipFriendShip" },
  { id: 2, label: "Chocolate", flag: "svtEquipChocolate" },
  { id: 3, label: "Commemorative", flag: "svtEquipCampaign" },
  { id: 4, label: "Normal", flag: "normal", raritySplit: true },
  { id: 5, label: "Event gacha", flag: "svtEquipEvent", raritySplit: true },
  { id: 6, label: "Event free", flags: ["svtEquipEventReward", "svtEquipExp"], raritySplit: true },
  { id: 7, label: "Manaprism exchange", flag: "svtEquipManaExchange", raritySplit: true },
  { id: 8, label: "Export data", special: "generate" },
];

const bondSubcategories = [
  { label: "2015", range: [0, 281] },
  { label: "2016", range: [282, 415] },
  { label: "2017", range: [416, 708] },
  { label: "2018", range: [709, 934] },
  { label: "2019", range: [935, 1144] },
  { label: "2020", range: [1145, 1337] },
  { label: "2021", range: [1338, 1522] },
  { label: "2022", range: [1523, 1739] },
  { label: "2023", range: [1740, 1962] },
  { label: "2024", range: [1963, 2159] },
  { label: "2025", range: [2160, 2899] },
];

const commemorativeSubcategories = [
  { label: "5M Downloads Heroic Portrait", range: [99, 108] },
  { label: "Fate/EXTELLA Release", range: [361, 366] },
  { label: "2nd Anni", range: [594, 640] },
  { label: "3rd Anni", range: [819, 857] },
  { label: "4th Anni", range: [1038, 1076] },
  { label: "5th Anni", range: [1222, 1269] },
  { label: "6th Anni", range: [1421, 1457] },
  { label: "7th Anni", range: [1626, 1663] },
  { label: "8th Anni", range: [1843, 1886] },
  { label: "Stay night 20th Anniversary", range: [1973, 1979] },
  { label: "9th Anni", range: [2058, 2099] },
  { label: "10th Anni", range: [2284, 2396] },
  { label: "Over the Same Sky June", range: [2240, 2258] },
  { label: "Over the Same Sky July", range: [2265, 2282] },
  { label: "Over the Same Sky August", range: [2421, 2436] },
  { label: "Over the Same Sky September", range: [2443, 2458] },
  { label: "Over the Same Sky October", range: [2479, 2492] },
];
const chocolateSubcategories = [
  { label: "2016 Valentine", range: [113, 153] },
  { label: "2017 Valentine", range: [430, 544] },
  { label: "2018 Valentine", range: [718, 761] },
  { label: "2019 Valentine", range: [949, 987] },
  { label: "2020 Valentine", range: [1155, 1195] },
  { label: "2021 Valentine", range: [1353, 1383] },
  { label: "2022 Valentine", range: [1533, 1563] },
  { label: "2023 Valentine", range: [1757, 1795] },
  { label: "2024 Valentine", range: [1986, 2019] },
  { label: "2025 Valentine", range: [2180, 2207] },
];

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
    } catch { }
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

  const [lastId, setLastId] = usePersistedState("lastId", "");
  const [offerAll, setOfferAll] = usePersistedState("offerAll", false);
  const [lookingAll, setLookingAll] = usePersistedState("lookingAll", false);

  const [selectionMode, setSelectionMode] = useState("none");
  const [sortAsc, setSortAsc] = usePersistedState("sortAsc", true);
  const [itemSize, setItemSize] = usePersistedState("itemSize", 72);

  const [undoState, setUndoState] = useState(null);
  const [showUndo, setShowUndo] = useState(false);

  const [isViewingShared, setIsViewingShared] = useState(false);
  const [sharedUserId, setSharedUserId] = useState("");
  const [viewCollection, setViewCollection] = useState({});
  const [viewLookingFor, setViewLookingFor] = useState({});
  const [viewOffering, setViewOffering] = useState({});

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  const [highlightId, setHighlightId] = useState(null);

  const [genUserId, setGenUserId] = useState("");
  const [generatedUrl, setGeneratedUrl] = useState("");

  const [data, setCollectionData] = useState([]);

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // State and refs for range-based drag selection
  const [isDragging, setIsDragging] = useState(false);
  const [dragToggleMode, setDragToggleMode] = useState(null); // 'check' or 'uncheck'
  const dragStartItem = useRef(null);
  const collectionSnapshot = useRef({});
  const lastDraggedOverId = useRef(null);
  const dragTimer = useRef(null); // Timer for long-press
  const dragStartPos = useRef(null); // {x, y} to check for scroll
  const scrollContainerRef = useRef(null); // Ref for the main scrollable area
  const panningState = useRef(null); // State for PC pan-to-scroll

  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetch("https://api.atlasacademy.io/export/JP/basic_equip_lang_en.json")
      .then((res) => res.json())
      .then((data) => setCollectionData(data));
  }, []);
  // helper: compute category object for an item (same rules as getItems)
  const getCategoryForItem = (item) => {
    return categories.find(cat => {
      if (cat.flag === "normal") return item.flag === "normal" || !Array.isArray(item.flags) || item.flags.length === 0;
      if (cat.flag) return item.flag === cat.flag || (Array.isArray(item.flags) && item.flags.includes(cat.flag));
      if (cat.flags) return cat.flags.some(f => item.flag === f || (Array.isArray(item.flags) && item.flags.includes(f)));
      return false;
    }) || categories[0];
  };

  // helper: find nearest vertical scrollable ancestor
  const findScrollableAncestor = (el) => {
    let parent = el.parentElement;
    while (parent && parent !== document.body) {
      const style = window.getComputedStyle(parent);
      if (/(auto|scroll)/.test(style.overflowY)) return parent;
      parent = parent.parentElement;
    }
    return document.scrollingElement || document.documentElement;
  };
  
  /**
   * Compresses a sorted list of numbers into a delta-encoded array.
   * e.g., [100, 102, 103, 107] -> [100, 2, 1, 4]
   */
  const compressList = (list) => {
    if (!list || list.length === 0) return [];
    // Ensure list is sorted numbers
    const sorted = list.map(Number).sort((a, b) => a - b);
    if (sorted.length === 0) return [];

    const deltas = [sorted[0]];
    for (let i = 1; i < sorted.length; i++) {
      deltas.push(sorted[i] - sorted[i - 1]);
    }
    return deltas;
  };

  /**
   * Expands a delta-encoded array back into a full list of numbers.
   * e.g., [100, 2, 1, 4] -> [100, 102, 103, 107]
   */
  const expandList = (deltas) => {
    if (!deltas || deltas.length === 0) return [];
    const list = [deltas[0]];
    for (let i = 1; i < deltas.length; i++) {
      list.push(list[i - 1] + deltas[i]);
    }
    return list;
  };

  // helper: scroll an element into view inside a specific container and center it
  const scrollElementIntoViewInContainer = (el, container) => {
    if (!el || !container) return;
    const isDocument = container === document.scrollingElement || container === document.documentElement;
    if (isDocument) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const elRect = el.getBoundingClientRect();
    const contRect = container.getBoundingClientRect();
    const offsetTop = elRect.top - contRect.top + container.scrollTop;
    const targetScroll = Math.max(0, offsetTop - (container.clientHeight / 2) + (elRect.height / 2));

    try {
      container.scrollTo({ top: targetScroll, behavior: 'smooth' });
    } catch {
      container.scrollTop = targetScroll;
    }
  };

  // Effect to handle ending a drag selection globally
  useEffect(() => {
    const handleDragEnd = () => {
      // 1. Always clear the long-press timer
      if (dragTimer.current) {
        clearTimeout(dragTimer.current);
        dragTimer.current = null;
      }
      dragStartPos.current = null;
      
      // 2. Your existing drag-end logic
      if (isDragging) {
        setIsDragging(false);
        setDragToggleMode(null);
        dragStartItem.current = null;
        collectionSnapshot.current = {};
        lastDraggedOverId.current = null;
      }
    };

    // This new function checks for "scroll-to-cancel"
    const handleMoveToCancel = (e) => {
      // If we don't have a pending timer, exit
      if (!dragStartPos.current || !dragTimer.current) {
        return;
      }

      const isTouch = e.type === 'touchmove';
      const point = isTouch ? e.touches[0] : e;
      const dx = Math.abs(point.clientX - dragStartPos.current.x);
      const dy = Math.abs(point.clientY - dragStartPos.current.y);

      // Threshold: if user moves > 10px, it's a scroll, not a drag.
      if (dx > 10 || dy > 10) {
        clearTimeout(dragTimer.current);
        dragTimer.current = null;
        dragStartPos.current = null;
      }
    };

    const handleTouchMove = (e) => {
      if (!isDragging) {
        // If not dragging, check if it's a scroll-to-cancel
        handleMoveToCancel(e);
        return;
      }

      // If we ARE dragging, we MUST prevent native scrolling.
      e.preventDefault();

      const touch = e.touches[0];
      const element = document.elementFromPoint(touch.clientX, touch.clientY);

      if (element) {
        const cell = element.closest('[id^="ce-"]');
        const cellId = cell?.id;

        if (cellId && cellId !== lastDraggedOverId.current) {
          const itemId = cellId.split('-')[1];
          const item = data.find(d => String(d.id) === itemId);
          if (item) {
            lastDraggedOverId.current = cellId;
            handleDragOver(item);
          }
        }
      }
    };

    window.addEventListener('mouseup', handleDragEnd);
    window.addEventListener('touchend', handleDragEnd);
    // We listen for mousemove to cancel a pending (0ms) drag
    window.addEventListener('mousemove', handleMoveToCancel, { passive: true });
    
    // We split touchmove:
    // 1. The main listener checks for drag *and* cancel
    //    It MUST be { passive: false } to allow preventDefault.
    window.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchend', handleDragEnd);
      window.removeEventListener('mousemove', handleMoveToCancel);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [isDragging, data, selectionMode]); // Rerun if dragging state or data changes

  // Build lookup tables once (outside generate/expand)
  const idToNo = {};
  const noToId = {};
  data.forEach(it => {
    idToNo[it.id] = it.collectionNo;
    noToId[it.collectionNo] = it.id;
  });

  // Debug helper
  const debugLink = (url) => {
    try {
      const parts = url.split("/#/view/");
      if (parts.length < 2) {
        console.warn("Not a valid debug URL:", url);
        return;
      }
      const [uid, compressed] = parts[1].split("/");
      const json = LZString.decompressFromEncodedURIComponent(compressed);
      const decoded = JSON.parse(json);
      console.log("📦 Debug Link:");
      console.log("User ID:", uid);
      console.log("Decoded payload:", decoded);
      return decoded;
    } catch (err) {
      console.error("Failed to debug link:", err);
    }
  };
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        if (query) {
          setQuery("");
          setResults([]);
          return;
        }
        if (isViewingShared) {
          exitViewerMode();
        } else {
          setActive(null);
          setSelectionMode("none");
          setShowUndo(false);
          setUndoState(null);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [query, isViewingShared]);

  useEffect(() => {
    const onKey = (e) => {
      const tag = document.activeElement.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || e.key === "Escape" || active) return;
      if (searchInputRef.current) searchInputRef.current.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  // expandCollection takes compressed categories and rebuilds full item map
  const expandCollection = (compressed, categories, data) => {
    const result = {};

    const expandSection = (section, items) => {
        if (!section) return;
        const ids = items.map(it => it.collectionNo);

        switch (section.m) { // 'm' for mode
          case 0: // Full
            ids.forEach(no => { result[noToId[no]] = true; });
            break;
          case 1: // Almost Full
            ids.forEach(no => { result[noToId[no]] = true; });
            // 'x' for missing, expand the delta list
            (expandList(section.x || [])).forEach(no => { result[noToId[no]] = false; });
            break;
          case 2: // Sparse
            // 'd' for data, expand the delta list
            (expandList(section.d || [])).forEach(no => { result[noToId[no]] = true; });
            break;
          case 3: // List
            // 'd' for data, expand the delta list
            (expandList(section.d || [])).forEach(no => { result[noToId[no]] = true; });
            break;
        }
      };

    categories.forEach(cat => {
      const items = data.filter(it => {
        if (cat.flag === "normal") {
          return it.flag === "normal" || !Array.isArray(it.flags) || it.flags.length === 0;
        }
        if (cat.flag) {
          return it.flag === cat.flag || (Array.isArray(it.flags) && it.flags.includes(cat.flag));
        }
        if (cat.flags) {
          return cat.flags.some(f => it.flag === f || (Array.isArray(it.flags) && it.flags.includes(f)));
        }
        if (cat.range) {
          return it.collectionNo >= cat.range[0] && it.collectionNo <= cat.range[1];
        }
        return false;
      });

    const compressedCat = compressed[cat.id];
      if (!compressedCat) return;

      if (compressedCat.m !== undefined) { // Check for 'm' instead of 'mode'
        // simple category compression (0/1/2/3)
        expandSection(compressedCat, items);
      } else {
        // subcategories
        if (cat.label === "Bond CEs") {
          bondSubcategories.forEach(sub => {
            const subsItems = items.filter(it =>
              it.collectionNo >= sub.range[0] && it.collectionNo <= sub.range[1]
            );
            const section = compressedCat[`${sub.range[0]}-${sub.range[1]}`];
            if (section) expandSection(section, subsItems);
          });
        } else if (cat.label === "Chocolate" || cat.label === "Commemorative") {
          const processedNos = new Set();
          const subs = (cat.label === "Chocolate"
            ? chocolateSubcategories
            : commemorativeSubcategories);
          subs.forEach(sub => {
            const subsItems = items.filter(it =>
              it.collectionNo >= sub.range[0] && it.collectionNo <= sub.range[1]
            );
            subsItems.forEach(it => processedNos.add(it.collectionNo));
            const section = compressedCat[`${sub.range[0]}-${sub.range[1]}`];
            if (section) expandSection(section, subsItems);
          });
          // Handle "rest" for these categories
          const restSection = compressedCat["rest"];
          if (restSection) {
            const restItems = items.filter(it => !processedNos.has(it.collectionNo));
            expandSection(restSection, restItems);
          }
        } else if (cat.raritySplit) {
          [5, 4, 3].forEach(r => {
            const subs = items.filter(it => it.rarity === r);
            const section = compressedCat[`rarity-${r}`];
            if (section) expandSection(section, subs);
          });
        } else {
          const section = compressedCat["all"];
          if (section) expandSection(section, items);
        }
      }
    });

    return result;
  };

  // --- Decoder ---    
  const tryDecodeLink = (url, categories, data) => {
    try {
      if (!url.includes("#/view/")) return null;

      // strip baseUrl if present
      const baseUrl = import.meta.env.BASE_URL || "/";
      const cleanUrl = url.replace(`${window.location.origin}${baseUrl}`, "");

      const [uid, compressed] = cleanUrl.split("#/view/")[1].split("/");
      const json = LZString.decompressFromEncodedURIComponent(compressed);
      if (!json) throw new Error("Decompression failed");

      const parsed = JSON.parse(json);
      if (!parsed || typeof parsed !== "object") throw new Error("Invalid payload");

      const cm = expandCollection(parsed.c, categories, data); 
      const lookingData = parsed.l; // 'l' for lookingFor
      const offeringData = parsed.o; // 'o' for offering

      return {
        uid,
        collection: cm,
        lookingFor: lookingData, // Pass the raw data on
        offering: offeringData,   // Pass the raw data on
      };
    } catch (err) {
      console.error("Failed to decode link:", err);
      return null;
    }
  };

  // --- Hook into component ---
  useEffect(() => {
    const handleLocationChange = () => {
      const baseUrl = import.meta.env.BASE_URL || "/";
      const decoded = tryDecodeLink(window.location.href, categories, data);

      if (!decoded) {
        // if we were in view mode but link is no longer valid, exit
        if (isViewingShared) {
          setIsViewingShared(false);
          setSharedUserId("");
          setViewCollection({});
          setViewLookingFor({});
          setViewOffering({});
          setActive(null);
          window.history.replaceState({}, "", baseUrl);
        }
        return;
      }

      // valid decoded payload → apply read-only state
      setIsViewingShared(true);
      setSharedUserId(decoded.uid);
      setViewCollection(decoded.collection);
      if (decoded.lookingFor === "ALL") {
        setViewLookingFor("ALL");
      } else {
        // Expand the delta list, then convert Collection No -> Item ID
        const expandedNos = expandList(decoded.lookingFor || []);
        const lfMap = {};
        expandedNos.forEach(no => {
          const id = noToId[no];
          if (id) lfMap[String(id)] = true;
        });
        setViewLookingFor(lfMap);
      }

      if (decoded.offering === "ALL") {
        setViewOffering("ALL");
      } else {
        // Expand the delta list, then convert Collection No -> Item ID
        const expandedNos = expandList(decoded.offering || []);
        const ofMap = {};
        expandedNos.forEach(no => {
          const id = noToId[no];
          if (id) ofMap[String(id)] = true;
        });
        setViewOffering(ofMap);
      }

      setActive(null);
    };

    // run once on mount
    handleLocationChange();
    window.addEventListener("popstate", handleLocationChange);
    window.addEventListener("hashchange", handleLocationChange);

    return () => {
      window.removeEventListener("popstate", handleLocationChange);
      window.removeEventListener("hashchange", handleLocationChange);
    };
  }, [categories, data, isViewingShared]);

  const searchRef = useRef(null);
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

  // Click handler for non-drag modes ('looking', 'offering')
  const onItemClick = (item) => {
    if (isViewingShared) return;

    if (selectionMode === "looking") {
      setLookingFor(prev => ({ ...prev, [item.id]: !prev[item.id] }));
      pulse(item.id);
      return;
    }

    if (selectionMode === "offering") {
      setOffering(prev => ({ ...prev, [item.id]: !prev[item.id] }));
      pulse(item.id);
      return;
    }
  };

  // Handlers for range-based drag selection
  const handleDragStart = (item) => {
    if (isViewingShared || selectionMode !== 'none') return;

    setIsDragging(true);
    dragStartItem.current = item;
    collectionSnapshot.current = collection; // Take snapshot of state at drag start

    const currentlyOwned = !!collection[item.id];
    const newMode = currentlyOwned ? 'uncheck' : 'check';
    setDragToggleMode(newMode);

    setCollection(prev => ({ ...prev, [item.id]: newMode === 'check' }));
  };

  const handleDragOver = (item) => {
    if (!isDragging || !dragStartItem.current || selectionMode !== 'none') return;

    const start = dragStartItem.current;
    const end = item;

    // 🔹 Restrict drag selection to only the subcategory currently being hovered
    const visibleItems = getItems(active);

    // Find which "section" the drag started in (rarity or subheader group)
    const sectionItems = (() => {
      // Case: Event free (rarity + subgroup flag)
      if (active.label === "Event free") {
        const isEventReward =
          start.flag === "svtEquipEventReward" ||
          (Array.isArray(start.flags) && start.flags.includes("svtEquipEventReward"));

        const isCEExp =
          start.flag === "svtEquipExp" ||
          (Array.isArray(start.flags) && start.flags.includes("svtEquipExp"));

        if (isEventReward) {
          return visibleItems.filter(
            (it) =>
              it.rarity === start.rarity &&
              (it.flag === "svtEquipEventReward" ||
                (Array.isArray(it.flags) && it.flags.includes("svtEquipEventReward")))
          );
        }
        if (isCEExp) {
          return visibleItems.filter(
            (it) =>
              it.rarity === start.rarity &&
              (it.flag === "svtEquipExp" ||
                (Array.isArray(it.flags) && it.flags.includes("svtEquipExp")))
          );
        }
      }

      // Case: generic rarity-split categories
      if (active.raritySplit) {
        return visibleItems.filter((it) => it.rarity === start.rarity);
      }

      // Case: Chocolate / Commemorative (subranges)
      if (active.label === "Chocolate") {
        const sub = chocolateSubcategories.find(
          (s) => start.collectionNo >= s.range[0] && start.collectionNo <= s.range[1]
        );
        return sub
          ? visibleItems.filter(
            (it) => it.collectionNo >= sub.range[0] && it.collectionNo <= sub.range[1]
          )
          : visibleItems;
      }
      if (active.label === "Commemorative") {
        const sub = commemorativeSubcategories.find(
          (s) => start.collectionNo >= s.range[0] && start.collectionNo <= s.range[1]
        );
        return sub
          ? visibleItems.filter(
            (it) => it.collectionNo >= sub.range[0] && it.collectionNo <= sub.range[1]
          )
          : visibleItems;
      }

      // Default (BondCEs, Normal, etc.)
      return visibleItems;
    })();

    // Apply range selection inside that section only
    const startIndex = sectionItems.findIndex(it => it.id === start.id);
    const endIndex = sectionItems.findIndex(it => it.id === end.id);

    if (startIndex === -1 || endIndex === -1) return;

    const minIndex = Math.min(startIndex, endIndex);
    const maxIndex = Math.max(startIndex, endIndex);

    const changes = {};
    for (let i = minIndex; i <= maxIndex; i++) {
      changes[sectionItems[i].id] = dragToggleMode === 'check';
    }

    setCollection({ ...collectionSnapshot.current, ...changes });
  };

  const getCategoryPercentage = (cat) => {
    const items = getItems(cat);
    if (!items.length) return 0;
    const ownedCount = items.filter(it => mapOwned(it.id)).length;
    return Math.round((ownedCount / items.length) * 100);
  };

  const markAll = (items, value) => {
    if (isViewingShared) return;

    const ownedCount = items.filter(it => collection[it.id]).length;
    if (ownedCount > 2) {
      const confirmed = window.confirm(
        "This will overwrite your current progress for this category. Are you sure?"
      );
      if (!confirmed) {
        return;
      }
    }

    // Save the current state for undo
    const currentCategoryState = {};
    items.forEach(it => {
      currentCategoryState[it.id] = !!collection[it.id];
    });
    setUndoState(currentCategoryState);
    setShowUndo(true);

    setCollection(prev => {
      const copy = { ...prev };
      -      items.forEach(it => copy[it.id] = value);
      items.forEach(it => (copy[it.id] = value));
      return copy;
    });
  };

  const getItems = (cat) => {
    if (!data || !data.length || !cat) return [];

    if (cat.flag === "normal") {
      return data.filter(it => it.flag === "normal" || !Array.isArray(it.flags) || it.flags.length === 0);
    }
    if (cat.flag) {
      return data.filter(it => it.flag === cat.flag || (Array.isArray(it.flags) && it.flags.includes(cat.flag)));
    }
    if (cat.flags) {
      return data.filter(it => cat.flags.some(f => it.flag === f || (Array.isArray(it.flags) && it.flags.includes(f))));
    }
    if (cat.range) {
      return data.filter(it => it.collectionNo >= cat.range[0] && it.collectionNo <= cat.range[1]);
    }
    return [];
  };

  // UPDATED: CECell handles new range-drag events
  const CECell = ({ item }) => {
    const owned = mapOwned(item.id);
    const isPulse = highlightId === item.id;
    // This logic checks if the item's current 'owned' state
    // is different from what it was when the drag began.
    const isAffected = isDragging && (owned !== !!collectionSnapshot.current[item.id]);
    // We pass the event AND the item
    const onInteractionStart = (e) => {
      handleInteractionStart(e, item);
    };

    return (
      <div
        id={`ce-${item.id}`}
        key={item.id}
        className={`relative ${sizeClasses[itemSize]} ${isPulse ? "pulse-border" : ""} ${isAffected ? "drag-selected" : ""} no-select`}
        style={{ cursor: isViewingShared ? 'default' : 'pointer', touchAction: 'none' }}
        onMouseDown={onInteractionStart}
        onTouchStart={onInteractionStart}
        onMouseEnter={() => handleDragOver(item)}
      >
        <img
          src={item.face}
          alt={item.name}
          title={item.name}
          className={`w-full h-full object-contain transition ${owned ? "opacity-100" : "opacity-50"}`}
          draggable="false"
          style={{ pointerEvents: "none" }}
        />
        <a
          href={`https://apps.atlasacademy.io/db/JP/craft-essence/${item.collectionNo}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`absolute bottom-0 right-0 ${fontClasses[itemSize]} leading-none bg-black/60 text-white px-1 rounded cursor-pointer hover:underline`}
          onClick={(e) => e.stopPropagation()}
        >
          {item.collectionNo}
        </a>
      </div>
    );
  };

  const handleInteractionStart = (e, item) => {
    // 1. Clear any pending drag timer
    if (dragTimer.current) {
      clearTimeout(dragTimer.current);
      dragTimer.current = null;
    }
    dragStartPos.current = null;

    // 2. Handle non-drag modes (looking, offering) immediately
    if (isViewingShared) return;
    if (selectionMode !== "none") {
      e.preventDefault(); // This is just a click, prevent default
      onItemClick(item);
      return;
    }

    // 3. Start logic for drag-select mode ('none')
    const isTouch = e.type === 'touchstart';
    const point = isTouch ? e.touches[0] : e;
    dragStartPos.current = { x: point.clientX, y: point.clientY };

    // 4. Set a timer to "activate" the drag
    // On PC (mousedown), it's instant.
    // On Touch, we wait ~250ms.
    const delay = isTouch ? 250 : 0; 

    dragTimer.current = setTimeout(() => {
      // Timer fired! This is now officially a drag.
      // We can no longer scroll.
      dragTimer.current = null;
      dragStartPos.current = null; // Don't check for scrolling anymore
      
      // Call your original drag-start logic
      handleDragStart(item); 
    }, delay);

    // 5. CRITICAL: Only preventDefault on MOUSE.
    // For TOUCH, we allow the default (scrolling)
    // until the timer fires or movement is detected.
    if (!isTouch) {
      e.preventDefault();
    }
  };

  const pulse = (id) => {
    setHighlightId(id);
    const el = document.getElementById(`ce-${id}`);
    if (el) {
      el.classList.remove("pulse-border");
      void el.offsetWidth;
      el.classList.add("pulse-border");
    }
    setTimeout(() => setHighlightId(null), 1800);
  };

  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }
    const q = query.toLowerCase();
    const qNum = Number(query);
    const filtered = data.filter(it =>
      (it.name && it.name.toLowerCase().includes(q)) ||
      (it.originalName && it.originalName.toLowerCase().includes(q)) ||
      (!isNaN(qNum) && it.collectionNo === qNum)
    );
    setResults(filtered.slice(0, 50));
  }, [query, data]);


  // replace your previous onSearchSelect with this:
  const onSearchSelect = (item) => {
    const matched = getCategoryForItem(item); // robust — doesn't rely on precomputed categoryId
    setActive(matched);
    setSelectionMode("none");

    // clear search UI immediately
    setQuery("");
    setResults([]);

    // Poll for the DOM element to exist and then scroll it into the modal's inner scroll container.
    let attempts = 0;
    const maxAttempts = 60; // ~1s worth of frames; tweak if needed

    const tryScroll = () => {
      attempts++;
      const el = document.getElementById(`ce-${item.id}`);
      if (el) {
        const container = findScrollableAncestor(el);
        scrollElementIntoViewInContainer(el, container);
        pulse(item.id);

        if (!isViewingShared) {
          // optional flash toggle behavior:
          setTimeout(() => {
            setCollection(prev => ({ ...prev, [item.id]: !prev[item.id] }));
            setTimeout(() => {
              setCollection(prev => ({ ...prev, [item.id]: !prev[item.id] }));
            }, 700);
          }, 250);
        }
        return;
      }

      if (attempts < maxAttempts) {
        requestAnimationFrame(tryScroll);
      } else {
        // final fallback
        setTimeout(() => {
          const el2 = document.getElementById(`ce-${item.id}`);
          if (el2) {
            const container = findScrollableAncestor(el2);
            scrollElementIntoViewInContainer(el2, container);
            pulse(item.id);
          }
        }, 150);
      }
    };

    // start next frame so React can mount modal + content
    requestAnimationFrame(tryScroll);
  };

  const generateLink = (uid) => {
    // helper: compress a group of items into F/AF/S/LIST, skip E
    const compressSection = (items, map) => {
        if (!items.length) return undefined; // Use undefined so JSON.stringify omits it

        const ids = items.map(it => it.collectionNo);
        const owned = ids.filter(no => map[noToId[no]]);
        const total = ids.length;
        const count = owned.length;

        if (count === 0) return undefined; // skip empty completely
        if (count === total) return { m: 0 }; // 0 = Full
        
        const missingNos = ids.filter(no => !map[noToId[no]]);
        if (count / total >= 0.85) {
          // 1 = Almost Full
          return { m: 1, x: compressList(missingNos) }; 
        }
        
        const ownedNos = ids.filter(no => map[noToId[no]]);
        if (count / total <= 0.15) {
          // 2 = Sparse
          return { m: 2, d: compressList(ownedNos) }; 
        }
        
        // 3 = List
        return { m: 3, d: compressList(ownedNos) }; 
      };

    const compressedCategories = {};

    categories.forEach(cat => {
      const items = getItems(cat);
      if (!items.length) return;

      // compress entire category first
      const catCompression = compressSection(items, collection);

      // if category is null (empty), skip entirely
      if (!catCompression) return;

      // if category is fully compressible (F/AF/S/LIST), store directly
      if (catCompression.mode !== "LIST") {
        compressedCategories[cat.id] = catCompression;
        return;
      }

      // otherwise split into subcategories
      const subsResult = {};
      const processedIds = new Set();

      if (cat.label === "Event free") {
        const rarities = [5, 4, 3];
        const subFlags = ["svtEquipEventReward", "svtEquipExp"];
        rarities.forEach(r => {
          subFlags.forEach(flag => {
            const subs = items.filter(it =>
              it.rarity === r &&
              (it.flag === flag || (Array.isArray(it.flags) && it.flags.includes(flag)))
            );
            if (subs.length) {
              const section = compressSection(subs, collection);
              if (section) subsResult[`${r}-${flag}`] = section;
            }
          });
        });

      } else if (cat.label === "Bond CEs") {
        bondSubcategories.forEach(sub => {
          const subsItems = items.filter(it =>
            it.collectionNo >= sub.range[0] && it.collectionNo <= sub.range[1]
          );
          subsItems.forEach(it => processedIds.add(it.id));
          if (subsItems.length) {
            const section = compressSection(subsItems, collection);
            if (section) subsResult[`${sub.range[0]}-${sub.range[1]}`] = section;
          }
        });

      } else if (cat.label === "Chocolate" || cat.label === "Commemorative") {
        const subs = (cat.label === "Chocolate"
          ? chocolateSubcategories
          : commemorativeSubcategories);
        subs.forEach(sub => {
          const subsItems = items.filter(it =>
            it.collectionNo >= sub.range[0] && it.collectionNo <= sub.range[1]
          );
          subsItems.forEach(it => processedIds.add(it.id));
          if (subsItems.length) {
            const section = compressSection(subsItems, collection);
            if (section) subsResult[`${sub.range[0]}-${sub.range[1]}`] = section;
          }
        });
      }
      // Common logic for categories with sub-ranges to handle "The rest"
      if (cat.label === "Bond CEs" || cat.label === "Chocolate" || cat.label === "Commemorative") {
        const restItems = items.filter(it => !processedIds.has(it.id));
        if (restItems.length > 0) {
          const restSection = compressSection(restItems, collection);
          if (restSection) subsResult["rest"] = restSection;
        }
      } else if (cat.raritySplit) {
        [5, 4, 3].forEach(r => {
          const subs = items.filter(it => it.rarity === r);
          if (subs.length) {
            const section = compressSection(subs, collection);
            if (section) subsResult[`rarity-${r}`] = section;
          }
        });

      } else {
        const section = compressSection(items, collection);
        if (section) subsResult["all"] = section;
      }

      if (Object.keys(subsResult).length) {
        compressedCategories[cat.id] = subsResult;
      }
    });

    const payload = {
        // 'c' for collection
        c: compressedCategories, 
        // 'l' for lookingFor
        l: lookingAll ? "ALL" : compressList(
          Object.keys(lookingFor).filter(k => lookingFor[k]).map(id => idToNo[id])
        ),
        // 'o' for offering
        o: offerAll ? "ALL" : compressList(
          Object.keys(offering).filter(k => offering[k]).map(id => idToNo[id])
        ),
      };

    const json = JSON.stringify(payload);
    const compressed = LZString.compressToEncodedURIComponent(json);

    const baseUrl = import.meta.env.BASE_URL || "/";
    return `${window.location.origin}${baseUrl}#/view/${uid}/${compressed}`;
  };

  const exitViewerMode = () => {
    setIsViewingShared(false);
    setSharedUserId("");
    setViewCollection({});
    setViewLookingFor({});
    setViewOffering({});
    window.location.hash = "";
  };

  const gridColsClass = (() => {
      if (!active) return 'grid-cols-10';

      const modalWidth = windowWidth * (11 / 12);
      const contentAreaWidth = modalWidth * (3 / 4);
      const padding = 32; // p-4 (1rem = 16px) on left and right
      const availableGridWidth = contentAreaWidth - padding;

      const size = Number(itemSize) || 72;
      const gap = 4; // from gap-1 (0.25rem = 4px)

      // Calculate width needed for N columns: (N * size) + ((N - 1) * gap)
      const getWidth = (n) => (n * size) + ((n - 1) * gap);

      if (availableGridWidth >= getWidth(10)) return 'grid-cols-10';
      if (availableGridWidth >= getWidth(9)) return 'grid-cols-9';
      if (availableGridWidth >= getWidth(8)) return 'grid-cols-8';
      if (availableGridWidth >= getWidth(7)) return 'grid-cols-7';
      if (availableGridWidth >= getWidth(6)) return 'grid-cols-6';
      if (availableGridWidth >= getWidth(5)) return 'grid-cols-5';
      if (availableGridWidth >= getWidth(4)) return 'grid-cols-4';
      if (availableGridWidth >= getWidth(3)) return 'grid-cols-3';
      if (availableGridWidth >= getWidth(2)) return 'grid-cols-2';
      
      // Fallback to 1 column if grid is extremely narrow
      return 'grid-cols-1';
    })();

  const renderSection = (title, sectionItems) => {
    if (!sectionItems || !sectionItems.length) return null;
    const allComplete = sectionItems.every(it => mapOwned(it.id));
    return (
      <div key={title}>
        <h3 className={`text-lg font-bold my-2 ${theme === "dark" ? "text-white" : "text-black"}`}>{title}</h3>
        {!isViewingShared && (
          <p className="text-sm text-blue-500 hover:underline cursor-pointer mb-2" onClick={() => markAll(sectionItems, !allComplete)}>
            {allComplete ? "Undo this subcategory" : "Complete this subcategory"}
          </p>
        )}
        <div className={`grid ${gridColsClass} gap-1 mb-6`}>
          {sectionItems.map((it) => <CECell key={it.id} item={it} />)}
        </div>
      </div>
    );
  };

  const sizeClasses = { 48: 'w-12 h-12', 72: 'w-[72px] h-[72px]', 100: 'w-[100px] h-[100px]', };
  const fontClasses = { 48: 'text-[10px]', 72: 'text-[14px]', 100: 'text-base', };

  const renderGrid = (items) => (
    <div 
      ref={scrollContainerRef} 
      className="flex-1 p-4 overflow-auto"
    >
      <div className={`grid ${gridColsClass} gap-1`}>
        {items.map(it => <CECell key={it.id} item={it} />)}
      </div>
    </div>
  );

  const SmallList = ({ map, listName, expandAll, dataCollection }) => {
    let ids = [];
    if (map === "ALL") {
      if (expandAll === "offering") ids = Object.keys(dataCollection).filter(k => dataCollection[k]);
      else if (expandAll === "looking") ids = data.map(d => String(d.id)).filter(id => !dataCollection[id]);
    } else {
      ids = Object.keys(map || {}).filter(k => map[k]);
    }

    // Reactive grid calculation for SmallList
    const previewGridColsClass = (() => {
      const modalWidth = windowWidth * (11 / 12);
      const contentAreaWidth = modalWidth * (3 / 4);
      const availableGridWidth = contentAreaWidth - 32; // ~ p-4 padding

      if (availableGridWidth > 720) return 'grid-cols-6';
      if (availableGridWidth > 600) return 'grid-cols-5';
      if (availableGridWidth > 480) return 'grid-cols-4';
      if (availableGridWidth > 360) return 'grid-cols-3';
      return 'grid-cols-2';
    })();

    if (!ids.length) return <div className="text-sm text-gray-500">none</div>;
    return (
      <>
        <p className="text-xs text-gray-500 mb-1">{ids.length} items</p>
        <div className={`grid ${previewGridColsClass} gap-2`}>
          {ids.map(id => {
            const item = data.find(d => String(d.id) === String(id));
            if (!item) return null;
            return (
              <div
                key={id}
                className={`flex items-center gap-2 p-1 bg-white/5 rounded ${map === "ALL" ? "" : "cursor-pointer hover:bg-white/10"
                  }`}
                onClick={() => {
                  if (isViewingShared || map === "ALL") return;
                  if (listName === "looking")
                    setLookingFor(prev => {
                      const c = { ...prev };
                      delete c[id];
                      return c;
                    });
                  else if (listName === "offering")
                    setOffering(prev => {
                      const c = { ...prev };
                      delete c[id];
                      return c;
                    });
                  pulse(id);
                }}
              >
                {/* Fixed-size image, now 25% bigger */}
                <div className="relative w-16 h-16 flex-shrink-0">
                  <img
                    src={item.face}
                    alt={item.name}
                    className="w-full h-full object-contain"
                  />
                  <span className="absolute bottom-0 right-0 text-[10px] bg-black/60 text-white px-1 rounded">
                    {item.collectionNo}
                  </span>
                </div>

                {/* Multi-line text with truncation */}
                <div className="flex-1 min-w-0">
                  <span className="block text-sm text-black dark:text-white line-clamp-3">
                    {item.name}
                  </span>
                </div>
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
      <style>{`
        .pulse-border { animation: pulseBorder 1.2s ease-in-out; border-radius: 6px; }
        @keyframes pulseBorder {
          0% { box-shadow: 0 0 0 0 rgba(246, 59, 59, 0.95); }
          50% { box-shadow: 0 0 12px 6px rgba(221, 246, 59, 1); }
          100% { box-shadow: 0 0 0 0 rgba(246, 59, 59, 1); }
        }

        .no-select {
          -webkit-user-select: none; /* Safari */
          -moz-user-select: none;    /* Firefox */
          -ms-user-select: none;     /* IE/Edge */
          user-select: none;         /* Standard */
        }

        .drag-selected {
          /* 5px outside (red-500 @ 90% opacity) */
          box-shadow: 0 0 0 5px rgba(239, 68, 68, 0.9),
          /* 5px inside (red-500 @ 90% opacity) */
                      inset 0 0 0 5px rgba(239, 68, 68, 0.9);
          border-radius: 6px; /* Matches your pulse-border */
        }
      `}</style>

      {/* Header */}
      <div className="p-4 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold"> CEdex {getProgress().owned > 0 && (<> ({getProgress().owned}/{getProgress().total})</>)} </h1>
        <div className="flex-1 max-w-xl">
          <div ref={searchRef} className="relative">
            <input
              ref={searchInputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setHighlightedIndex(-1); // reset when typing
              }}
              onKeyDown={(e) => {
                if (!results.length) return;

                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setHighlightedIndex((prev) => (prev + 1) % results.length);
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setHighlightedIndex((prev) => (prev - 1 + results.length) % results.length);
                } else if (e.key === "Enter") {
                  e.preventDefault();
                  if (highlightedIndex >= 0) {
                    onSearchSelect(results[highlightedIndex]);
                  }
                }
              }}
              placeholder="Search by name or ID..."
              className="w-full px-4 py-2 rounded-xl border dark:border-gray-600 bg-white dark:bg-gray-800 text-black dark:text-white"
            />
            {results.length > 0 && (
              <div className="absolute z-50 top-full left-0 right-0 bg-white dark:bg-gray-700 rounded-xl shadow-lg max-h-96 overflow-auto mt-2">
                {results.map((item, idx) => (
                  <div
                    key={item.id}
                    ref={(el) => {
                      if (idx === highlightedIndex && el) {
                        el.scrollIntoView({ block: "nearest" });
                      }
                    }}
                    className={`flex items-center gap-3 p-2 cursor-pointer ${highlightedIndex === idx
                      ? "bg-gray-200 dark:bg-gray-600"
                      : "hover:bg-gray-100 dark:hover:bg-gray-600"
                      }`}
                    onClick={() => onSearchSelect(item)}
                  >
                    <div className="relative w-12 h-12 flex-shrink-0">
                      <img
                        src={item.face}
                        alt={item.name}
                        className={`w-12 h-12 object-contain ${mapOwned(item.id) ? "opacity-100" : "opacity-50"}`}
                      />
                      <span className="absolute bottom-0 right-0 text-[10px] leading-none bg-black/60 text-white px-1 rounded">
                        {item.collectionNo}
                      </span>
                    </div>
                    <div className="text-sm text-black dark:text-white">{item.name}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isViewingShared && (
            <div
              className="bg-amber-300 dark:bg-amber-600 text-black dark:text-white px-3 py-1 rounded-xl text-sm font-semibold cursor-pointer hover:bg-amber-400 dark:hover:bg-amber-500 transition"
              title="Click to import this collection as your own (this will overwrite your local data)"
              onClick={() => {
                if (window.confirm(`This will overwrite your current collection with the data from '${sharedUserId}'.\n\nThis action cannot be undone. Are you sure you want to import it?`)) {
                  setCollection(viewCollection);
                  if (viewLookingFor === "ALL") {
                    setLookingAll(true);
                    setLookingFor({});
                  } else {
                    setLookingAll(false);
                    setLookingFor(viewLookingFor);
                  }
                  if (viewOffering === "ALL") {
                    setOfferAll(true);
                    setOffering({});
                  } else {
                    setOfferAll(false);
                    setOffering(viewOffering);
                  }
                  exitViewerMode();
                }
              }}
            >
              Viewing {sharedUserId} (read-only)
            </div>
          )}
          <button className="px-4 py-2 rounded-xl bg-blue-500 text-white hover:bg-blue-600 transition" onClick={() => setTheme(t => t === "light" ? "dark" : "light")}>
            {theme === "light" ? <Moon /> : <Sun />}
          </button>
        </div>
      </div>

      {/* Tailwind JIT Safelist: ensures grid-cols-1 through 10 are generated */}
      <div className="hidden grid-cols-1 grid-cols-2 grid-cols-3 grid-cols-4 grid-cols-5 grid-cols-6 grid-cols-7 grid-cols-8 grid-cols-9 grid-cols-10"></div>
      
      {/* Main cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 min-h-[50vh]">
        {categories.map(cat => (
          <div key={cat.id} className="relative bg-gray-100 dark:bg-gray-700 rounded-2xl shadow cursor-pointer hover:shadow-lg transition h-[250px] flex items-center justify-center" onClick={() => { setActive(cat); setSelectionMode("none"); setShowUndo(false); setUndoState(null); }}>
            <img src={`${import.meta.env.BASE_URL}${cat.label.replace(/\s+/g, "_")}.png`} alt="" className="absolute inset-0 w-full h-full object-cover rounded-2xl opacity-40" onError={(e) => e.currentTarget.style.display = 'none'} />
            <span className={theme === "dark" ? "relative text-4xl font-bold text-center [text-shadow:2px_2px_3px_black]" : "relative text-3xl font-bold text-center [text-shadow:1px_1px_3px_white]"}>{cat.label}</span>
            {cat.special !== "generate" && <span className={theme === "dark" ? "absolute bottom-2 right-2 text-2xl font-bold [text-shadow:2px_2px_3px_black]" : "absolute bottom-2 right-2 text-2xl font-bold"}>{getCategoryPercentage(cat)}%</span>}
          </div>
        ))}
      </div>

      {/* Expanded modal */}
      <AnimatePresence>
        {active && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 flex justify-center items-center z-50" onClick={(e) => { if (e.target === e.currentTarget) { setActive(null); setSelectionMode("none"); setShowUndo(false); setUndoState(null); } }}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className={`rounded-2xl shadow-xl w-11/12 h-5/6 overflow-hidden flex ${theme === "dark" ? "bg-gray-800 text-white" : "bg-white text-black"}`}>
              {/* Sidebar */}
              <div className="w-1/4 p-4 border-r dark:border-gray-700 flex flex-col gap-3 overflow-y-auto">
                <div className="flex items-center flex-wrap">
                  <h2 className="text-xl font-bold">{active.label}</h2>
                  {(active.label === "Bond CEs" ||
                    active.label === "Chocolate" ||
                    active.label === "Commemorative" ||
                    active.label === "Event free" ||
                    (active.raritySplit && active.special !== "generate")) && (
                      <div className="flex items-center ml-auto">
                        <button onClick={() => setSortAsc((prev) => !prev)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition" title={sortAsc ? "Sort Descending" : "Sort Ascending"}>
                          {sortAsc ? <ArrowDownNarrowWide size={20} /> : <ArrowUpNarrowWide size={20} />}
                        </button>
                        <button
                          onClick={() => setItemSize(s => s === 72 ? 100 : s === 100 ? 48 : 72)}
                          className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                          title={`Change item size (current: ${itemSize}px)`}
                        >
                          <ZoomIn size={20} />
                        </button>
                      </div>
                    )
                  }
                </div>
                {active.special !== "generate" && !isViewingShared && (
                  <>
                    <button className="px-4 py-2 rounded-xl bg-green-500 text-white" onClick={() => markAll(getItems(active), true)}>Mark all have</button>
                    <button className="px-4 py-2 rounded-xl bg-yellow-500 text-white" onClick={() => markAll(getItems(active), false)}>Mark all don't have</button>
                    <button className={`px-4 py-2 rounded-xl ${selectionMode === "looking" ? "bg-blue-500 text-white" : "bg-blue-100 text-black"}`} onClick={() => setSelectionMode(s => s === "looking" ? "none" : "looking")}>Looking for</button>
                    <button className={`px-4 py-2 rounded-xl ${selectionMode === "offering" ? "bg-blue-500 text-white" : "bg-blue-100 text-black"}`} onClick={() => setSelectionMode(s => s === "offering" ? "none" : "offering")}>Offering</button>
                  </>
                )}
                {active.special !== "generate" && showUndo && (
                  <button
                    className="px-4 py-2 rounded-xl bg-pink-500 text-white hover:bg-pink-600 transition"
                    onClick={() => {
                      if (undoState) {
                        setCollection(prev => ({ ...prev, ...undoState }));
                        setUndoState(null);
                        setShowUndo(false);
                      }
                    }}
                  >
                    Undo Change
                  </button>
                )}
                {active.special === "generate" && lastId && !isViewingShared && <button className="px-4 py-2 rounded-xl bg-purple-500 text-white" onClick={() => setGenUserId(lastId)}>Paste in last ID {lastId}</button>}
                <button className="px-4 py-2 rounded-xl bg-red-500 text-white" onClick={() => { setActive(null); setSelectionMode("none"); setShowUndo(false); setUndoState(null); }}>Close</button>
                {active.special !== "generate" && <div className={`mt-1 font-semibold ${theme === "dark" ? "text-white" : "text-black"}`}>Category progress: {getCategoryProgress(active).owned}/{getCategoryProgress(active).total}</div>}
              </div>

              {/* Main content */}
              {active.special === "generate" ? (
                <div className="flex-1 p-6 overflow-auto text-black dark:text-white bg-white dark:bg-gray-800">
                  {isViewingShared ? (
                    <>
                      <h3 className="text-lg font-bold mb-2">Looking for {viewLookingFor === "ALL" ? `(${data.filter(d => !viewCollection[d.id]).length} items)` : ""}</h3>
                      <SmallList map={viewLookingFor} listName="looking" expandAll="looking" dataCollection={viewCollection} />
                      <h3 className="text-lg font-bold mt-4 mb-2">Offering {viewOffering === "ALL" ? `(${Object.keys(viewCollection).filter(k => viewCollection[k]).length} items)` : ""}</h3>
                      <SmallList map={viewOffering} listName="offering" expandAll="offering" dataCollection={viewCollection} />
                      <div className="mt-6 font-semibold">Overall progress: {getProgress().owned}/{getProgress().total}</div>
                      <p className="mt-4 text-sm text-gray-400">Viewing only — controls are hidden.</p>
                    </>
                  ) : (
                    <>
                      <h2 className="text-lg font-bold mb-2">Share Your Collection</h2>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Enter your 9 or 12 digit ID, then click <strong>Generate Hash</strong> to create a shareable link.</p>
                      <input type="text" value={genUserId} onChange={e => setGenUserId(e.target.value.replace(/[^\d]/g, ''))} className="w-full p-2 mb-3 rounded border dark:bg-gray-700" placeholder="012345678" />
                      <div className="flex gap-2 mb-3">
                        <button className="px-4 py-2 rounded-xl bg-blue-500 text-white" onClick={() => { if (!/^(?:\d{9}|\d{12})$/.test(genUserId)) { alert('ID must be 9 or 12 digits'); return; } setLastId(genUserId); const url = generateLink(genUserId); debugLink(url); setGeneratedUrl(url); try { navigator.clipboard.writeText(url); } catch { } }}>Generate Hash</button>
                        <button className="px-4 py-2 rounded-xl bg-gray-300" onClick={() => { setGenUserId(''); setGeneratedUrl(''); }}>Clear</button>
                      </div>
                      <div className="flex gap-3 mb-4">
                        <button className={`px-3 py-2 rounded-xl ${offerAll ? "bg-blue-600 text-white" : "bg-blue-200 text-black"}`} onClick={() => { setOfferAll(v => !v); if (!offerAll) setOffering({}); }}>{offerAll ? "Undo Offer Everything" : "Offer everything I have"}</button>
                        <button className={`px-3 py-2 rounded-xl ${lookingAll ? "bg-blue-600 text-white" : "bg-blue-200 text-black"}`} onClick={() => { setLookingAll(v => !v); if (!lookingAll) setLookingFor({}); }}>{lookingAll ? "Undo Looking for Everything" : "Looking for everything I don't have"}</button>
                      </div>
                      {generatedUrl && <div className="mt-4 p-3 bg-green-100 dark:bg-green-900 rounded-xl cursor-pointer hover:bg-green-200 dark:hover:bg-green-800 transition" onClick={() => { navigator.clipboard.writeText(generatedUrl); }}><p className="text-sm font-semibold mb-1">Your link:</p><p className="break-all text-sm text-green-700 dark:text-green-300">{generatedUrl}</p></div>}
                      <div className="mt-6 p-3 bg-yellow-100 dark:bg-yellow-800 rounded-xl text-sm"><p className="mb-1 font-semibold">Tips:</p><ul className="list-disc pl-5 space-y-1"><li>You can click items in the preview to remove them from explicit lists.</li><li>Paste your 9/12 digit ID or drag a text onto this window.</li><li>The link contains your data compressed for sharing.</li></ul></div>
                      <div className="mt-6">
                        <h4 className="font-bold">Preview: Looking for {lookingAll ? `(${data.filter(d => !collection[d.id]).length} items)` : ""}</h4>
                        <SmallList map={lookingAll ? "ALL" : lookingFor} listName="looking" expandAll="looking" dataCollection={collection} />
                        <h4 className="font-bold mt-3">Preview: Offering {offerAll ? `(${Object.keys(collection).filter(k => collection[k]).length} items)` : ""}</h4>
                        <SmallList map={offerAll ? "ALL" : offering} listName="offering" expandAll="offering" dataCollection={collection} />
                      </div>
                      <div className="mt-6 font-semibold">Overall progress: {getProgress().owned}/{getProgress().total}</div>
                    </>
                  )}
                </div>
              ) : (
                (() => {
                  const items = getItems(active).sort((a, b) => a.collectionNo - b.collectionNo);
                  const renderWithSubcategories = (items, subs, gridColsClass) => {
                    const sortedSubs = sortAsc ? subs : [...subs].reverse();
                    const used = new Set();
                    return (
                      <div className="flex-1 p-4 overflow-auto">
                        {sortedSubs.map((sub) => {
                          const subItems = items.filter(it => it.collectionNo >= sub.range[0] && it.collectionNo <= sub.range[1]);
                          subItems.forEach((si) => used.add(si.id));
                          return renderSection(sub.label, subItems);
                        })}
                        {(() => { const rest = items.filter((it) => !used.has(it.id)); return renderSection("The rest", rest); })()}
                      </div>
                    );
                  };
                  const renderByRarity = (items, gridColsClass) => { const rarities = sortAsc ? [5, 4, 3, 2, 1] : [1, 2, 3, 4, 5]; return (<div className="flex-1 p-4 overflow-auto"> {rarities.map((r) => renderSection(`Rarity ${r}`, items.filter((it) => it.rarity === r)))} </div>); }; if (active.label === "Bond CEs") return renderWithSubcategories(items, bondSubcategories, gridColsClass); if (active.label === "Chocolate") return renderWithSubcategories(items, chocolateSubcategories, gridColsClass); if (active.label === "Commemorative") return renderWithSubcategories(items, commemorativeSubcategories, gridColsClass);
                  if (active.label === "Event free") {
                    const rarities = sortAsc ? [5, 4, 3] : [3, 4, 5];
                    const subFlags = [{ key: "svtEquipEventReward", label: "Event Reward" }, { key: "svtEquipExp", label: "CE EXP" }];
                    return (
                      <div className="flex-1 p-4 overflow-auto">
                        {rarities.map(r => (
                          <div key={r}>
                            <h3 className={`text-lg font-bold my-4 ${theme === "dark" ? "text-white" : "text-black"}`}>Rarity {r}</h3>
                            {subFlags.map(sf => {
                              const subs = items.filter(it => it.rarity === r && (it.flag === sf.key || (Array.isArray(it.flags) && it.flags.includes(sf.key))));
                              if (!subs.length) return null;
                              const allComplete = subs.every(it => mapOwned(it.id));
                              return (
                                <div key={sf.key} className="mb-6">
                                  <h4 className={`text-md font-semibold mb-1 ${theme === "dark" ? "text-white" : "text-black"}`}>{sf.label}</h4>
                                  {!isViewingShared && <p className="text-sm text-blue-500 hover:underline cursor-pointer mb-2" onClick={() => markAll(subs, !allComplete)}>{allComplete ? "Undo this subcategory" : "Complete this subcategory"}</p>}
                                  <div className={`grid ${gridColsClass} gap-1`}>{subs.map(it => <CECell key={it.id} item={it} />)}</div>
                                </div>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    );
                  }
                  if (active.raritySplit) return renderByRarity(items, gridColsClass);
                  return renderGrid(items, gridColsClass);
                })()
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}