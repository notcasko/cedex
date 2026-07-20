import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon, ArrowUpNarrowWide, ArrowDownNarrowWide, ZoomIn, Folder, FolderMinus, FolderPlus, Router, Hand, Link as LinkIcon, ExternalLink, Check, CheckCheck, Search } from "lucide-react";
import LZString from "lz-string";
import bondCeJson from "./data/bond_ces.json";
import localforage from "localforage";

const i18n = {
  en: {
    categories: {
      "Bond CEs": "Bond CEs",
      "Chocolate": "Chocolate",
      "Commemorative": "Commemorative",
      "Normal": "Normal",
      "Event gacha": "Event gacha",
      "Event free": "Event free",
      "Manaprism exchange": "Manaprism exchange",
      "Export data": "Export data"
    },
    subcategories: {
      "2015": "2015",
      "2016": "2016",
      "2017": "2017",
      "2018": "2018",
      "2019": "2019",
      "2020": "2020",
      "2021": "2021",
      "2022": "2022",
      "2023": "2023",
      "2024": "2024",
      "2025": "2025",
      "2026": "2026",
      "5M Downloads Heroic Portrait": "5M Downloads Heroic Portrait",
      "Fate/EXTELLA Release": "Fate/EXTELLA Release",
      "2nd Anni": "2nd Anni",
      "3rd Anni": "3rd Anni",
      "4th Anni": "4th Anni",
      "5th Anni": "5th Anni",
      "6th Anni": "6th Anni",
      "7th Anni": "7th Anni",
      "8th Anni": "8th Anni",
      "Stay night 20th Anniversary": "Stay night 20th Anniversary",
      "9th Anni": "9th Anni",
      "10th Anni": "10th Anni",
      "Over the Same Sky June": "Over the Same Sky June",
      "Over the Same Sky July": "Over the Same Sky July",
      "Over the Same Sky August": "Over the Same Sky August",
      "Over the Same Sky September": "Over the Same Sky September",
      "Over the Same Sky October": "Over the Same Sky October",
      "Over the Same Sky November": "Over the Same Sky November",
      "Part 2 Finale": "Part 2 Finale",
      "2016 Valentine": "2016 Valentine",
      "2017 Valentine": "2017 Valentine",
      "2018 Valentine": "2018 Valentine",
      "2019 Valentine": "2019 Valentine",
      "2020 Valentine": "2020 Valentine",
      "2021 Valentine": "2021 Valentine",
      "2022 Valentine": "2022 Valentine",
      "2023 Valentine": "2023 Valentine",
      "2024 Valentine": "2024 Valentine",
      "2025 Valentine": "2025 Valentine",
      "2026 Valentine": "2026 Valentine"
    },
    ui: {
      searchPlaceholder: "Search by name or ID...",
      viewingShared: "Viewing {id} (read-only)",
      importConfirm: "This will overwrite your current collection with the data from '{id}'.\n\nThis action cannot be undone. Are you sure you want to import it?",
      importTooltip: "Click to import this collection as your own (this will overwrite your local data)",
      markAllConfirm: "This will overwrite your current progress for this category. Are you sure?",
      copyFail: "Link generated, but failed to copy. Open Trade Hub to manually copy.",
      invalidId: "ID must be 9 or 12 digits",
      viewingOnly: "Viewing only — controls are hidden.",
      missingSuffix: ": Missing",
      haveSuffix: ": Have",
      undoSubcategory: "Undo this subcategory",
      completeSubcategory: "Complete this subcategory",
      noItemsMatch: "No items match the current filter.",
      categoryProgress: "Category progress:",
      sortDescending: "Sort Descending",
      sortAscending: "Sort Ascending",
      filterItems: "Filter items",
      changeItemSize: "Change item size",
      markAllHave: "Mark all have",
      markAllDontHave: "Mark all don't have",
      lookingFor: "Looking for",
      offering: "Offering",
      undoChange: "Undo Change",
      pasteLastId: "Paste last ID",
      close: "Close",
      shareCollection: "Share Your Collection",
      shareInstructions: "Enter your 9 or 12 digit ID, then click Generate Hash to create a shareable link.",
      generateHash: "Generate Hash",
      clear: "Clear",
      pointToTradeHub: "Point to Trade Hub",
      undoOfferEverything: "Undo Offer Everything",
      offerEverything: "Offer everything I have",
      undoLookingEverything: "Undo Looking for Everything",
      lookingEverything: "Looking for everything I don't have",
      yourLink: "Your link:",
      tips: "Tips:",
      tip1: "You can click items in the preview to remove them from explicit lists.",
      tip2: "Paste your 9/12 digit ID or drag a text onto this window.",
      tip3: "The link contains your data compressed for sharing.",
      previewLooking: "Preview: Looking for",
      previewOffering: "Preview: Offering",
      overallProgress: "Overall progress:",
      itemsCount: "items",
      none: "none",
      theRest: "The rest",
      rarity: "Rarity",
      eventReward: "Event Reward",
      ceExp: "CE EXP",
      openTradeHub: "Open Trade Hub",
      copyLink: "Copy Link",
      fullOpacityOn: "Missing items shown at full opacity",
      fullOpacityOff: "Missing items shown with grey opacity",
      dragSelectOn: "Drag Selection ON (Not for touch screens)",
      dragSelectOff: "Drag Selection OFF (Made for touch screens)",
      cacheOn: "Image Caching Enabled",
      cacheOff: "Image Caching Disabled"
    }
  },
  ja: {
    categories: {
      "Bond CEs": "絆礼装",
      "Chocolate": "チョコ",
      "Commemorative": "記念",
      "Normal": "恒常",
      "Event gacha": "限定",
      "Event free": "配布",
      "Manaprism exchange": "マナプリ",
      "Export data": "データ出力"
    },
    subcategories: {
      "2015": "2015年",
      "2016": "2016年",
      "2017": "2017年",
      "2018": "2018年",
      "2019": "2019年",
      "2020": "2020年",
      "2021": "2021年",
      "2022": "2022年",
      "2023": "2023年",
      "2024": "2024年",
      "2025": "2025年",
      "2026": "2026年",
      "5M Downloads Heroic Portrait": "500万DL突破キャンペーン",
      "Fate/EXTELLA Release": "「Fate/EXTELLA」発売記念キャンペーン",
      "2nd Anni": "2周年",
      "3rd Anni": "3周年",
      "4th Anni": "4周年",
      "5th Anni": "5周年",
      "6th Anni": "6周年",
      "7th Anni": "7周年",
      "8th Anni": "8周年",
      "Stay night 20th Anniversary": "「Fate/stay night」20周年記念キャンペーン",
      "9th Anni": "9周年",
      "10th Anni": "10周年",
      "Over the Same Sky June": "Over the Same Sky 6月",
      "Over the Same Sky July": "Over the Same Sky 7月",
      "Over the Same Sky August": "Over the Same Sky 8月",
      "Over the Same Sky September": "Over the Same Sky 9月",
      "Over the Same Sky October": "Over the Same Sky 10月",
      "Over the Same Sky November": "Over the Same Sky 11月",
      "Part 2 Finale": "第2部 終章",
      "2016 Valentine": "2016バレンタイン",
      "2017 Valentine": "2017バレンタイン",
      "2018 Valentine": "2018バレンタイン",
      "2019 Valentine": "2019バレンタイン",
      "2020 Valentine": "2020バレンタイン",
      "2021 Valentine": "2021バレンタイン",
      "2022 Valentine": "2022バレンタイン",
      "2023 Valentine": "2023バレンタイン",
      "2024 Valentine": "2024バレンタイン",
      "2025 Valentine": "2025バレンタイン",
      "2026 Valentine": "2026バレンタイン"
    },
    ui: {
      searchPlaceholder: "名前またはIDで検索...",
      viewingShared: "{id} のコレクションを表示中（閲覧のみ）",
      importConfirm: "現在のコレクションが「{id}」のデータで上書きされます。\n\nこの操作は取り消せません。本当にインポートしますか？",
      importTooltip: "クリックしてこのコレクションを自分のものとしてインポートします（現在のデータは上書きされます）",
      markAllConfirm: "このカテゴリーの現在の進捗が上書きされます。本当によろしいですか？",
      copyFail: "リンクは生成されましたが、コピーに失敗しました。Trade Hubを開いて手動でコピーしてください。",
      invalidId: "IDは9桁または12桁である必要があります",
      viewingOnly: "閲覧専用 — 操作は無効化されています。",
      missingSuffix: "：未所持",
      haveSuffix: "：所持",
      undoSubcategory: "このサブカテゴリを未達成に戻す",
      completeSubcategory: "このサブカテゴリを達成にする",
      noItemsMatch: "該当するアイテムがありません。",
      categoryProgress: "カテゴリー進捗:",
      sortDescending: "降順ソート",
      sortAscending: "昇順ソート",
      filterItems: "アイテムをフィルター",
      changeItemSize: "サイズを変更",
      markAllHave: "すべて所持にする",
      markAllDontHave: "すべて未所持にする",
      lookingFor: "募集依頼",
      offering: "提供可能",
      undoChange: "変更を元に戻す",
      pasteLastId: "最後のIDを貼り付け",
      close: "閉じる",
      shareCollection: "コレクションを共有する",
      shareInstructions: "9桁または12桁のIDを入力し、「ハッシュ生成」をクリックして共有リンクを作成します。",
      generateHash: "ハッシュ生成",
      clear: "クリア",
      pointToTradeHub: "トレードハブへ指定",
      undoOfferEverything: "すべての提供を解除",
      offerEverything: "所持しているすべてを提供",
      undoLookingEverything: "すべての募集を解除",
      lookingEverything: "未所持のすべてを募集",
      yourLink: "あなたのリンク:",
      tips: "ヒント:",
      tip1: "プレビュー内のアイテムをクリックすると、リストから除外できます。",
      tip2: "9/12桁のIDを貼り付けるか、テキストをこのウィンドウにドラッグしてください。",
      tip3: "リンクには共有用に圧縮されたデータが含まれています。",
      previewLooking: "プレビュー: 募集依頼",
      previewOffering: "プレビュー: 提供可能",
      overallProgress: "全体の進捗:",
      itemsCount: "個のアイテム",
      none: "なし",
      theRest: "その他",
      rarity: "レア度",
      eventReward: "イベント報酬",
      ceExp: "概念礼装EXP",
      openTradeHub: "トレードハブを開く",
      copyLink: "リンクをコピー",
      fullOpacityOn: "未所持のアイテムを不透明度100%で表示",
      fullOpacityOff: "未所持のアイテムを半透明で表示",
      dragSelectOn: "ドラッグ選択 ON (タッチ操作非推奨)",
      dragSelectOff: "ドラッグ選択 OFF (タッチ操作推奨)",
      cacheOn: "画像キャッシュ有効",
      cacheOff: "画像キャッシュ無効"
    }
  }
};

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
  { label: "2025", range: [2160, 2538] },
  { label: "2026", range: [2539, 3000] },
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
  { label: "Over the Same Sky November", range: [2495, 2508] },
  { label: "Part 2 Finale", range: [2512, 2532] },
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
  { label: "2026 Valentine", range: [2556, 2581] },
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

const sizeClasses = { 48: 'w-12 h-12', 72: 'w-[72px] h-[72px]', 100: 'w-[100px] h-[100px]', };
const fontClasses = { 48: 'text-[9px]', 72: 'text-[12px]', 100: 'text-sm', };

const CECell = React.memo(({
  item,
  bondFace,
  cachingMode,
  owned,
  isPulse,
  isAffected,
  itemSize,
  isViewingShared,
  selectionMode,
  filterMode,
  dragSelectEnabled,
  onItemClick,
  onDragStart,
  onDragOver,
  onToggle,
  fullOpacityMissing,
  theme,
  lang
}) => {
  const [imageUrl, setImageUrl] = useState(null);
  const [showBondFace, setShowBondFace] = useState(false);

  const itemName = lang === 'ja' ? (item.originalName || item.name) : item.name;

  useEffect(() => {
    if (!item.face) return;
    let objectUrl = null;
    const loadCachedImage = async () => {
      try {
        const cachedBlob = await localforage.getItem(item.face);
        if (cachedBlob) {
          objectUrl = URL.createObjectURL(cachedBlob);
          setImageUrl(objectUrl);
        } else {
          const response = await fetch(item.face);
          if (!response.ok) throw new Error('Failed to fetch image');
          const blob = await response.blob();
          await localforage.setItem(item.face, blob);
          objectUrl = URL.createObjectURL(blob);
          setImageUrl(objectUrl);
        }
      } catch (error) {
        console.error("Failed to load or cache image:", item.face, error);
        setImageUrl(item.face);
      }
    };
    if (cachingMode) loadCachedImage();
    else setImageUrl(item.face);
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [item.face, cachingMode]);

  useEffect(() => {
    if (!bondFace) {
      setShowBondFace(false);
      return;
    }
    const interval = setInterval(() => {
      setShowBondFace(prev => !prev);
    }, 5000);
    return () => clearInterval(interval);
  }, [bondFace]);

  const handleInteractionStart = (e) => {
    if (e.button !== 0 && e.type === 'mousedown') return;
    if (isViewingShared) return;
    if (!dragSelectEnabled && selectionMode === 'none') return;
    if (e.cancelable) e.preventDefault();
    if (selectionMode !== "none") return;
    if (filterMode !== 'all') onToggle(item);
    else onDragStart(item);
  };

  const handleClick = (e) => {
    if (isViewingShared) return;
    if (dragSelectEnabled && selectionMode === 'none') return;
    if (selectionMode !== "none") {
      onItemClick(item);
    } else {
      onToggle(item);
    }
  };

  const activeTouchAction = (dragSelectEnabled && selectionMode === 'none' && !isViewingShared)
    ? 'none'
    : 'pan-y';

  const showMissingFullOpacity = filterMode === 'missing' && fullOpacityMissing;
  const baseOpacityClass = owned || showMissingFullOpacity ? "opacity-100" : "opacity-50";

  return (
    <div
      id={`ce-${item.id}`}
      className={`relative ${sizeClasses[itemSize]} ${isPulse ? "pulse-border" : ""} ${isAffected ? "drag-selected" : ""} no-select rounded-lg overflow-hidden border ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}
      style={{
        cursor: isViewingShared ? 'default' : 'pointer',
        touchAction: activeTouchAction
      }}
      onMouseDown={handleInteractionStart}
      onTouchStart={handleInteractionStart}
      onClick={handleClick}
      onMouseEnter={() => onDragOver(item)}
    >
      <img
        src={imageUrl || ''}
        alt={itemName}
        title={itemName}
        className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-500 rounded-lg ${imageUrl && !showBondFace ? baseOpacityClass : "opacity-0"}`}
        draggable="false"
        style={{ pointerEvents: "none" }}
      />
      {bondFace && (
        <img
          src={bondFace}
          alt={`${itemName} Owner`}
          className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-500 rounded-lg ${showBondFace ? baseOpacityClass : "opacity-0"}`}
          draggable="false"
          style={{ pointerEvents: "none" }}
        />
      )}
      <a
        href={`https://apps.atlasacademy.io/db/JP/craft-essence/${item.collectionNo}`}
        target="_blank"
        rel="noopener noreferrer"
        className={`absolute bottom-1 right-1 ${fontClasses[itemSize]} leading-none bg-black/75 text-white px-1 py-0.5 rounded-sm cursor-pointer hover:underline z-10`}
        onClick={(e) => e.stopPropagation()}
      >
        {item.collectionNo}
      </a>
    </div>
  );
});
CECell.displayName = 'CECell';

export default function App() {
  const searchInputRef = useRef(null);
  const [theme, setTheme] = usePersistedState("theme", "dark");
  const [lang, setLang] = usePersistedState("lang", "en");
  const [active, setActive] = useState(null);
  const [collection, setCollection] = usePersistedState("collection", {});
  const [lookingFor, setLookingFor] = usePersistedState("lookingFor", {});
  const [offering, setOffering] = usePersistedState("offering", {});

  const [lastId, setLastId] = usePersistedState("lastId", "");
  const [offerAll, setOfferAll] = usePersistedState("offerAll", false);
  const [lookingAll, setLookingAll] = usePersistedState("lookingAll", false);

  const [selectionMode, setSelectionMode] = useState("none");
  const [sortAsc, setSortAsc] = usePersistedState("sortAsc", true);
  const [itemSize, setItemSize] = usePersistedState("itemSize", 72);
  const [cachingMode, setCachingMode] = usePersistedState("cachingMode", false);
  const [filterMode, setFilterMode] = useState("all");

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

  const [isDragging, setIsDragging] = useState(false);
  const [dragToggleMode, setDragToggleMode] = useState(null);
  const dragStartItem = useRef(null);
  const collectionSnapshot = useRef({});
  const lastDraggedOverId = useRef(null);
  const [dragSelectEnabled, setDragSelectEnabled] = usePersistedState("dragSelectEnabled", true);
  const [fullOpacityMissing, setFullOpacityMissing] = usePersistedState("fullOpacityMissing", false);

  const bondCeMap = useMemo(() => {
    const map = {
      byCollectionNo: {},
      byChocoId: {}
    };
    for (const item of bondCeJson) {
      const data = {
        owner: (item.owner || "").toLowerCase(),
        owner_jp: (item.owner_jp || "").toLowerCase(),
        face: item.face
      };
      map.byCollectionNo[item.id] = data;
      if (item.choco_id) {
        if (Array.isArray(item.choco_id)) {
          for (const chocoId of item.choco_id) {
            map.byChocoId[chocoId] = data;
          }
        } else {
          map.byChocoId[item.choco_id] = data;
        }
      }
    }
    return map;
  }, []);

  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  useEffect(() => {
    fetch("https://api.atlasacademy.io/export/JP/basic_equip_lang_en.json")
      .then((res) => res.json())
      .then((data) => setCollectionData(data));
  }, []);

  const getItems = useCallback((cat) => {
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
  }, [data]);

  const getCategoryForItem = (item) => {
    return categories.find(cat => {
      if (cat.flag === "normal") return item.flag === "normal" || !Array.isArray(item.flags) || item.flags.length === 0;
      if (cat.flag) return item.flag === cat.flag || (Array.isArray(item.flags) && item.flags.includes(cat.flag));
      if (cat.flags) return cat.flags.some(f => item.flag === f || (Array.isArray(it.flags) && it.flags.includes(f)));
      return false;
    }) || categories[0];
  };

  const findScrollableAncestor = (el) => {
    let parent = el.parentElement;
    while (parent && parent !== document.body) {
      const style = window.getComputedStyle(parent);
      if (/(auto|scroll)/.test(style.overflowY)) return parent;
      parent = parent.parentElement;
    }
    return document.scrollingElement || document.documentElement;
  };

  const compressList = (list) => {
    if (!list || list.length === 0) return [];
    const sorted = list.map(Number).sort((a, b) => a - b);
    if (sorted.length === 0) return [];
    const deltas = [sorted[0]];
    for (let i = 1; i < sorted.length; i++) {
      deltas.push(sorted[i] - sorted[i - 1]);
    }
    return deltas;
  };

  const expandList = (deltas) => {
    if (!deltas || deltas.length === 0) return [];
    const list = [deltas[0]];
    for (let i = 1; i < deltas.length; i++) {
      list.push(list[i - 1] + deltas[i]);
    }
    return list;
  };

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

  const onItemClick = useCallback((item) => {
    if (isViewingShared) return;
    const itemId = String(item.id);
    if (selectionMode === "looking") {
      setLookingFor(prev => ({ ...prev, [itemId]: !prev[itemId] }));
      pulse(item.id);
      return;
    }
    if (selectionMode === "offering") {
      setOffering(prev => ({ ...prev, [itemId]: !prev[itemId] }));
      pulse(item.id);
      return;
    }
  }, [isViewingShared, selectionMode]);

  const handleDragStart = useCallback((item) => {
    if (isViewingShared || selectionMode !== 'none') return;
    setIsDragging(true);
    dragStartItem.current = item;
    collectionSnapshot.current = collection;
    const currentlyOwned = !!collection[item.id];
    const newMode = currentlyOwned ? 'uncheck' : 'check';
    setDragToggleMode(newMode);
    setCollection(prev => ({ ...prev, [item.id]: newMode === 'check' }));

    if (newMode === 'check') {
      setLookingFor(prev => {
        if (!prev[item.id]) return prev;
        const copy = { ...prev };
        delete copy[item.id];
        return copy;
      });
    }
  }, [isViewingShared, selectionMode, collection, dragSelectEnabled]);

  const handleDragOver = useCallback((item) => {
    if (!isDragging || !dragStartItem.current || selectionMode !== 'none') return;
    const start = dragStartItem.current;
    const end = item;
    const visibleItems = getItems(active);
    const sectionItems = (() => {
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
      if (active.raritySplit) {
        return visibleItems.filter((it) => it.rarity === start.rarity);
      }
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
      return visibleItems;
    })();

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
    if (dragToggleMode === 'check') {
      setLookingFor(prev => {
        const copy = { ...prev };
        let hasChanges = false;
        for (let i = minIndex; i <= maxIndex; i++) {
          const id = sectionItems[i].id;
          if (copy[id]) {
            delete copy[id];
            hasChanges = true;
          }
        }
        return hasChanges ? copy : prev;
      });
    }
  }, [isDragging, selectionMode, active, dragToggleMode, getItems, dragSelectEnabled]);

  const handleToggle = useCallback((item) => {
    const currentlyOwned = !!collection[item.id];
    setCollection(prev => ({ ...prev, [item.id]: !currentlyOwned }));
    if (!currentlyOwned) {
      setLookingFor(prev => {
        if (!prev[item.id]) return prev;
        const copy = { ...prev };
        delete copy[item.id];
        return copy;
      });
    }
  }, [collection]);

  useEffect(() => {
    const handleDragEnd = () => {
      if (isDragging) {
        setIsDragging(false);
        setDragToggleMode(null);
        dragStartItem.current = null;
        collectionSnapshot.current = {};
        lastDraggedOverId.current = null;
      }
    };
    const handleTouchMove = (e) => {
      if (!isDragging) return;
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
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    return () => {
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchend', handleDragEnd);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [isDragging, data, handleDragOver]);

  const idToNo = {};
  const noToId = {};
  data.forEach(it => {
    idToNo[it.id] = it.collectionNo;
    noToId[it.collectionNo] = it.id;
  });

  const debugLink = (url) => {
    try {
      const parts = url.split("/#/view/");
      if (parts.length < 2) return;
      const [uid, compressed] = parts[1].split("/");
      const json = LZString.decompressFromEncodedURIComponent(compressed);
      const decoded = JSON.parse(json);
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
          setFilterMode("all");
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

  const expandCollection = (compressed, categories, data) => {
    const result = {};
    const expandSection = (section, items) => {
      if (!section) return;
      const ids = items.map(it => it.collectionNo);
      switch (section.m) {
        case 0:
          ids.forEach(no => { result[noToId[no]] = true; });
          break;
        case 1:
          ids.forEach(no => { result[noToId[no]] = true; });
          (expandList(section.x || [])).forEach(no => { result[noToId[no]] = false; });
          break;
        case 2:
          (expandList(section.d || [])).forEach(no => { result[noToId[no]] = true; });
          break;
        case 3:
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
      if (compressedCat.m !== undefined) {
        expandSection(compressedCat, items);
      } else {
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

  const tryDecodeLink = (url, categories, data) => {
    try {
      if (!url.includes("#/view/")) return null;

      const baseUrl = import.meta.env.BASE_URL || "/";
      const cleanUrl = url.replace(`${window.location.origin}${baseUrl}`, "");
      const parts = cleanUrl.split("#/view/")[1].split("/");

      const uid = parts[0];
      const compressed = parts[1];
      const shouldOpen = parts.includes("open");
      const isJa = parts.includes("ja");

      const raw = LZString.decompressFromEncodedURIComponent(compressed);
      if (!raw) throw new Error("Decompression failed");

      let i = 0;
      const len = raw.length;

      const parsed = { c: {}, l: null, o: null };

      const readNumberList = () => {
        let buf = "";
        while (i < len && /[0-9,]/.test(raw[i])) {
          buf += raw[i++];
        }
        return buf ? buf.split(",").map(Number) : [];
      };

      while (i < len) {
        const key = raw[i++];

        if (key === "c") {
          let catId = "";
          while (i < len && /[0-9]/.test(raw[i])) catId += raw[i++];
          catId = Number(catId);

          const modeChar = raw[i++];
          if (modeChar !== "m") throw new Error("Invalid category encoding");

          const mode = Number(raw[i++]);
          const section = { m: mode };

          if (raw[i] === "x") {
            i++;
            section.x = readNumberList();
          } else if (raw[i] === "d") {
            i++;
            section.d = readNumberList();
          }

          parsed.c[catId] = section;
        }

        else if (key === "l" || key === "o") {
          if (raw.startsWith("ALL", i)) {
            parsed[key] = "ALL";
            i += 3;
          } else {
            parsed[key] = readNumberList();
          }
        }

        else {
          throw new Error("Unknown token");
        }
      }

      const cm = expandCollection(parsed.c, categories, data);

      return {
        uid,
        collection: cm,
        lookingFor: parsed.l,
        offering: parsed.o,
        shouldOpen,
        isJa
      };

    } catch (err) {
      console.error("Failed to decode link:", err);
      return null;
    }
  };

  useEffect(() => {
    const handleLocationChange = () => {
      const baseUrl = import.meta.env.BASE_URL || "/";
      const decoded = tryDecodeLink(window.location.href, categories, data);
      if (!decoded) {
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
      setIsViewingShared(true);
      setSharedUserId(decoded.uid);
      setViewCollection(decoded.collection);
      if (decoded.isJa) {
        setLang("ja");
      }
      if (decoded.lookingFor === "ALL") {
        setViewLookingFor("ALL");
      } else {
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
        const expandedNos = expandList(decoded.offering || []);
        const ofMap = {};
        expandedNos.forEach(no => {
          const id = noToId[no];
          if (id) ofMap[String(id)] = true;
        });
        setViewOffering(ofMap);
      }
      if (decoded.shouldOpen) {
        setActive(categories.find(c => c.special === 'generate'));
      } else {
        setActive(null);
      }
    };
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
    if (!items.length) return { owned: 0, total: 0, percentage: 0 };
    const owned = items.filter(it => mapOwned(it.id)).length;
    const total = items.length;
    return { owned, total, percentage: total ? Math.floor((owned / total) * 100) : 0 };
  };

  const markAll = (items, value) => {
    if (isViewingShared) return;
    const ownedCount = items.filter(it => collection[it.id]).length;
    if (ownedCount > 2) {
      const confirmed = window.confirm(
        i18n[lang].ui.markAllConfirm
      );
      if (!confirmed) {
        return;
      }
    }
    const currentCategoryState = {};
    items.forEach(it => {
      currentCategoryState[it.id] = !!collection[it.id];
    });
    setUndoState(currentCategoryState);
    setShowUndo(true);
    setCollection(prev => {
      const copy = { ...prev };
      items.forEach(it => (copy[it.id] = value));
      return copy;
    });
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
      (!isNaN(qNum) && it.collectionNo === qNum) ||
      (bondCeMap.byCollectionNo[it.collectionNo]?.owner?.includes(q)) ||
      (bondCeMap.byCollectionNo[it.collectionNo]?.owner_jp?.includes(q)) ||
      (bondCeMap.byChocoId[it.collectionNo]?.owner?.includes(q)) ||
      (bondCeMap.byChocoId[it.collectionNo]?.owner_jp?.includes(q))
    );
    setResults(filtered.slice(0, 50));
  }, [query, data, bondCeMap]);

  const onSearchSelect = (item) => {
    const matched = getCategoryForItem(item);
    setActive(matched);
    setSelectionMode("none");
    setQuery("");
    setResults([]);
    let attempts = 0;
    const maxAttempts = 60;
    const tryScroll = () => {
      attempts++;
      const el = document.getElementById(`ce-${item.id}`);
      if (el) {
        const container = findScrollableAncestor(el);
        scrollElementIntoViewInContainer(el, container);
        pulse(item.id);
        if (!isViewingShared) {
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
    requestAnimationFrame(tryScroll);
  };

  const generateLink = (uid, openMode = false) => {
    const compressSection = (items, map) => {
      if (!items.length) return null;

      const ids = items.map(it => it.collectionNo);
      const owned = ids.filter(no => map[noToId[no]]);
      const total = ids.length;
      const count = owned.length;

      if (count === 0) return null;
      if (count === total) return "m0";

      const ratio = count / total;

      if (ratio >= 0.85) {
        const missing = ids.filter(no => !map[noToId[no]]);
        return `m1x${compressList(missing).join(",")}`;
      }

      const ownedNos = owned;
      if (ratio <= 0.15) {
        return `m2d${compressList(ownedNos).join(",")}`;
      }

      return `m3d${compressList(ownedNos).join(",")}`;
    };

    let cStr = "";

    categories.forEach(cat => {
      const items = getItems(cat);
      if (!items.length) return;

      const base = compressSection(items, collection);
      if (!base) return;

      cStr += `c${cat.id}${base}`;
    });

    const lStr =
      lookingAll
        ? "lALL"
        : `l${compressList(
          Object.keys(lookingFor)
            .filter(k => lookingFor[k])
            .map(id => idToNo[id])
        ).join(",")}`;

    const oStr =
      offerAll
        ? "oALL"
        : `o${compressList(
          Object.keys(offering)
            .filter(k => offering[k])
            .map(id => idToNo[id])
        ).join(",")}`;

    const raw = `${cStr}${lStr}${oStr}`;
    const compressed = LZString.compressToEncodedURIComponent(raw);

    const baseUrl = import.meta.env.BASE_URL || "/";
    let link = `${window.location.origin}${baseUrl}#/view/${uid}/${compressed}`;
    if (openMode) link += "/open";
    if (lang === "ja") link += "/ja";

    return link;
  };

  const exitViewerMode = () => {
    setIsViewingShared(false);
    setSharedUserId("");
    setViewCollection({});
    setViewLookingFor({});
    setViewOffering({});
    window.location.hash = "";
  };

  const renderSection = (title, sectionItems) => {
    if (!sectionItems || !sectionItems.length) return null;
    const progress = {
      owned: sectionItems.filter(it => mapOwned(it.id)).length,
      total: sectionItems.length
    };
    const getFaceUrl = (it) => {
      if (active?.label === "Bond CEs") {
        return bondCeMap.byCollectionNo[it.collectionNo]?.face;
      }
      if (active?.label === "Chocolate") {
        return bondCeMap.byChocoId[it.collectionNo]?.face;
      }
      return null;
    };
    const visibleItems = sectionItems.filter(it => {
      if (filterMode === 'missing') return !mapOwned(it.id);
      if (filterMode === 'completed') return mapOwned(it.id);
      return true;
    });

    let displayTitle = title;
    if (i18n[lang].subcategories && i18n[lang].subcategories[title]) {
      displayTitle = i18n[lang].subcategories[title];
    } else if (title === "The rest") {
      displayTitle = i18n[lang].ui.theRest;
    } else if (title.startsWith("Rarity ")) {
      displayTitle = title.replace("Rarity ", `${i18n[lang].ui.rarity} `);
    }

    if (filterMode === 'missing') {
      displayTitle = `${displayTitle}${i18n[lang].ui.missingSuffix}`;
    } else if (filterMode === 'completed') {
      displayTitle = `${displayTitle}${i18n[lang].ui.haveSuffix}`;
    }

    const allComplete = sectionItems.every(it => mapOwned(it.id));
    return (
      <div key={displayTitle}>
        <div className="flex justify-between items-center my-2">
          <h3 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{displayTitle}</h3>
          <span className={`text-sm font-semibold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{progress.owned} / {progress.total}</span>
        </div>
        {!isViewingShared && (
          <p className="text-sm text-blue-500 hover:underline cursor-pointer mb-2" onClick={() => markAll(sectionItems, !allComplete)}>
            {allComplete ? i18n[lang].ui.undoSubcategory : i18n[lang].ui.completeSubcategory}
          </p>
        )}
        <div className="grid gap-1 mb-6" style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${itemSize}px, 1fr))` }}>
          {visibleItems.length > 0
            ? visibleItems.map((it) => (
              <CECell
                key={it.id}
                item={it}
                bondFace={getFaceUrl(it)}
                dragSelectEnabled={dragSelectEnabled}
                cachingMode={cachingMode}
                owned={mapOwned(it.id)}
                isPulse={highlightId === it.id}
                isAffected={isDragging && (mapOwned(it.id) !== !!collectionSnapshot.current[it.id])}
                itemSize={itemSize}
                isViewingShared={isViewingShared}
                selectionMode={selectionMode}
                filterMode={filterMode}
                onItemClick={onItemClick}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onToggle={handleToggle}
                fullOpacityMissing={fullOpacityMissing}
                theme={theme}
                lang={lang}
              />
            ))
            : <div className={`text-sm col-span-full ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              {i18n[lang].ui.noItemsMatch}
            </div>
          }
        </div>
      </div>
    );
  };

  const renderGrid = (items) => (
    (() => {
      const visibleItems = items.filter(it => {
        if (filterMode === 'missing') return !mapOwned(it.id);
        if (filterMode === 'completed') return mapOwned(it.id);
        return true;
      });
      const getFaceUrl = (it) => {
        if (active?.label === "Bond CEs") {
          return bondCeMap.byCollectionNo[it.collectionNo]?.face;
        }
        if (active?.label === "Chocolate") {
          return bondCeMap.byChocoId[it.collectionNo]?.face;
        }
        return null;
      };
      return (
        <div className={`flex-1 p-4 overflow-y-auto ${theme === 'dark' ? 'bg-[#0a0f1d]' : 'bg-white'}`}>
          <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${itemSize}px, 1fr))` }}>
            {visibleItems.length > 0
              ? visibleItems.map(it => (
                <CECell
                  key={it.id}
                  item={it}
                  bondFace={getFaceUrl(it)}
                  dragSelectEnabled={dragSelectEnabled}
                  cachingMode={cachingMode}
                  owned={mapOwned(it.id)}
                  isPulse={highlightId === it.id}
                  isAffected={isDragging && (mapOwned(it.id) !== !!collectionSnapshot.current[it.id])}
                  itemSize={itemSize}
                  isViewingShared={isViewingShared}
                  selectionMode={selectionMode}
                  filterMode={filterMode}
                  onItemClick={onItemClick}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onToggle={handleToggle}
                  fullOpacityMissing={fullOpacityMissing}
                  theme={theme}
                  lang={lang}
                />
              ))
              : <div className={`text-sm col-span-full p-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{i18n[lang].ui.noItemsMatch}</div>
            }
          </div>
        </div>
      );
    })()
  );

  const SmallList = ({ map, listName, expandAll, dataCollection }) => {
    let ids = [];
    if (map === "ALL") {
      if (expandAll === "offering") ids = Object.keys(dataCollection).filter(k => dataCollection[k]);
      else if (expandAll === "looking") ids = data.map(d => String(d.id)).filter(id => !dataCollection[id]);
    } else {
      ids = Object.keys(map || {}).filter(k => map[k]);
    }

    if (!ids.length) return <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{i18n[lang].ui.none}</div>;
    return (
      <>
        <p className={`text-xs mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{ids.length} {i18n[lang].ui.itemsCount}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {ids.map(id => {
            const item = data.find(d => String(d.id) === String(id));
            if (!item) return null;
            const itemName = lang === 'ja' ? (item.originalName || item.name) : item.name;
            return (
              <div
                key={id}
                className={`flex items-center gap-3 p-2 border rounded-xl transition ${
                  theme === 'dark' ? 'border-gray-800 bg-[#111a36]' : 'border-gray-200 bg-gray-100'
                } ${map === "ALL" ? "" : theme === 'dark' ? "cursor-pointer hover:bg-[#1f2e54]" : "cursor-pointer hover:bg-gray-200"
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
                <div className={`relative w-16 h-16 flex-shrink-0 border rounded-lg overflow-hidden bg-black/10 ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                  <img
                    src={item.face}
                    alt={itemName}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <span className={`text-sm font-medium mb-0.5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    No. {item.collectionNo}
                  </span>
                  <span className={`text-sm font-medium truncate block ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`} title={itemName}>
                    {itemName}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </>
    );
  };

  const renderMainCard = (cat) => {
    const prog = cat.special === "generate" ? getProgress() : getCategoryProgress(cat);
    const pct = cat.special === "generate" ? (prog.total ? Math.floor((prog.owned / prog.total) * 100) : 0) : prog.percentage;

    return (
      <div
        key={cat.id}
        className={`group relative rounded-2xl shadow-md h-[250px] overflow-hidden transition hover:shadow-xl border cursor-pointer ${
          theme === 'dark' ? 'bg-[#111a36] border-gray-800 text-white' : 'bg-white border-gray-200 text-black'
        }`}
        onClick={() => {
          setActive(cat);
          setSelectionMode("none");
          setShowUndo(false);
          setUndoState(null);
        }}
      >
        <div className="relative z-10 p-5 flex flex-col h-full justify-between w-full pointer-events-none">
          <div className={`p-2 rounded-xl w-fit bg-gradient-to-r ${
            theme === 'dark' 
              ? 'bg-gradient-to-r from-[#111a36] from-50% to-transparent to-100%'
              : 'bg-gradient-to-r from-white from-50% to-transparent to-100%'
          }`}>
            <span className={`text-2xl font-medium tracking-tight line-clamp-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {i18n[lang].categories[cat.label] || cat.label}
            </span>
          </div>

          <div className="flex flex-col gap-1 w-full">
            <div className={`flex justify-between items-end ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
              <span className="text-xs font-normal">{prog.owned} / {prog.total}</span>
              <span className="text-xl font-semibold tracking-tight">{pct}%</span>
            </div>
            <div className={`w-full h-2 rounded-full overflow-hidden ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'}`}>
              <div 
                className="bg-gradient-to-l from-purple-500 to-blue-500 h-full transition-all duration-300" 
                style={{ width: `${pct}%` }} 
              />
            </div>
          </div>
        </div>

        <div 
          className={`absolute overflow-hidden border transition-transform duration-500 group-hover:scale-[1.03] z-0 pointer-events-none ${
            theme === 'dark' ? 'bg-[#0a0f1d] border-gray-800' : 'bg-slate-100 border-gray-200'
          }`}
          style={{
            width: '360px',
            height: '468px',
            top: '-180.5px',
            right: '-140px',
            borderRadius: '50%',
          }}
        >
          <img
            src={`${import.meta.env.BASE_URL}${cat.label.replace(/\s+/g, "_")}.png`}
            alt=""
            className="w-full object-cover opacity-85"
            style={{
              position: 'absolute',
              top: '180.5px',
              left: '-13%',  
              height: '250px',
              objectFit: 'cover',
              maskImage: 'linear-gradient(to bottom, white 0%, transparent 95%)',
              WebkitMaskImage: 'linear-gradient(to bottom, white 0%, transparent 95%)'
            }}
            onError={(e) => e.currentTarget.style.display = 'none'}
          />
        </div>

        {cat.special === "generate" && (
          <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 z-20 backdrop-blur-xs">
            <button
              onClick={(e) => { e.stopPropagation(); setActive(cat); setSelectionMode("none"); setShowUndo(false); setUndoState(null); }}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center gap-2 text-sm transform hover:scale-105 transition shadow-lg"
            >
              <ExternalLink size={16} />
              {i18n[lang].ui.openTradeHub}
            </button>
            {!isViewingShared && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (lastId) {
                    const uid = lastId;
                    setGenUserId(uid);
                    const url = generateLink(uid);
                    setGeneratedUrl(url);
                    try {
                      navigator.clipboard.writeText(url);
                    } catch (e) {
                      console.error("Failed to copy link:", e);
                      alert(i18n[lang].ui.copyFail);
                    }
                  } else {
                    setActive(cat);
                    setSelectionMode("none");
                  }
                }}
                className="px-5 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold flex items-center gap-2 text-sm transform hover:scale-105 transition shadow-lg"
              >
                <LinkIcon size={16} />
                {i18n[lang].ui.copyLink}
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={theme === "dark" ? "dark bg-[#0a0f1d] text-white min-h-screen" : "bg-[#f8fafc] text-black min-h-screen"}>
      <style>{`
        .pulse-border { animation: pulseBorder 1.2s ease-in-out; border-radius: 0.5rem; }
        @keyframes pulseBorder {
          0% { box-shadow: 0 0 0 0 rgba(246, 59, 59, 0.95); }
          50% { box-shadow: 0 0 12px 6px rgba(221, 246, 59, 1); }
          100% { box-shadow: 0 0 0 0 rgba(246, 59, 59, 1); }
        }
        .no-select {
          -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none;
        }
        .drag-selected {
          box-shadow: 0 0 0 5px rgba(239, 68, 68, 0.9), inset 0 0 0 5px rgba(239, 68, 68, 0.9);
          border-radius: 0.5rem;
        }
      `}</style>
      
      <div className={`p-4 flex flex-wrap items-center justify-between gap-4 border-b shadow-sm ${
        theme === 'dark' ? 'bg-[#111a36] border-gray-800 text-white' : 'bg-[#e2e8f0] border-gray-300 text-black'
      }`}>
        <h1 className={`text-2xl font-bold md:order-1 order-1 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
          <span className="bg-gradient-to-tr from-purple-400 to-blue-400 bg-clip-text text-transparent font-extrabold">
            {lang === "ja" ? "マテ埋め" : "CEdex"}
          </span>
          {getProgress().owned > 0 && (<span className={`text-lg font-semibold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}> ({getProgress().owned}/{getProgress().total})</span>)}
        </h1>
        <div className="w-full md:flex-1 md:max-w-xl md:order-2 order-3">
          <div ref={searchRef} className="relative flex items-center">
            <Search className="absolute left-3 text-gray-400 w-5 h-5 pointer-events-none" />
            <input
              ref={searchInputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setHighlightedIndex(-1);
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
              placeholder={i18n[lang].ui.searchPlaceholder}
              className={`w-full pl-10 pr-4 py-2 rounded-xl border text-base focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                theme === 'dark' ? 'bg-[#0a0f1d] text-white border-gray-700' : 'bg-white text-black border-gray-400'
              }`}
            />
            {results.length > 0 && (
              <div className={`absolute z-50 top-full left-0 right-0 rounded-xl shadow-lg max-h-96 overflow-auto mt-2 border ${
                theme === 'dark' ? 'bg-[#111a36] border-gray-700 text-white' : 'bg-white border-gray-250 text-black'
              }`}>
                {results.map((item, idx) => {
                  const itemSearchName = lang === 'ja' ? (item.originalName || item.name) : item.name;
                  return (
                    <div
                      key={item.id}
                      ref={(el) => {
                        if (idx === highlightedIndex && el) {
                          el.scrollIntoView({ block: "nearest" });
                        }
                      }}
                      className={`flex items-center gap-3 p-2 cursor-pointer ${highlightedIndex === idx
                        ? theme === 'dark' ? "bg-[#0a0f1d]" : "bg-gray-200"
                        : theme === 'dark' ? "hover:bg-[#0a0f1d]" : "hover:bg-gray-100"
                        }`}
                      onClick={() => onSearchSelect(item)}
                    >
                      <div className="relative w-20 h-20 flex-shrink-0">
                        <img
                          src={item.face}
                          alt={itemSearchName}
                          className={`w-20 h-20 object-contain ${mapOwned(item.id) ? "opacity-100" : "opacity-50"}`}
                        />
                        <span className="absolute bottom-1 right-1 text-[12px] leading-none bg-black/60 text-white px-1 rounded-sm">
                          {item.collectionNo}
                        </span>
                      </div>
                      <div className={`text-base ${theme === 'dark' ? 'text-white' : 'text-black'}`}>{itemSearchName}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 md:order-3 order-2 w-full md:w-auto justify-center md:justify-start">
          {isViewingShared && (
            <div
              className="whitespace-nowrap bg-amber-500 text-white px-3 py-1 rounded-xl text-sm font-semibold cursor-pointer hover:bg-amber-400 transition shadow-sm"
              title={i18n[lang].ui.importTooltip}
              onClick={() => {
                if (window.confirm(i18n[lang].ui.importConfirm.replace("{id}", sharedUserId))) {
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
              {i18n[lang].ui.viewingShared.replace("{id}", sharedUserId)}
            </div>
          )}
          <div className="flex flex-wrap gap-3">
          <button
            className={`px-4 py-2 rounded-xl transition shadow-sm ${fullOpacityMissing ? 'bg-amber-500 text-white hover:bg-amber-600' : theme === 'dark' ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-400 text-white hover:bg-gray-500'}`}
            onClick={() => setFullOpacityMissing(v => !v)}
            title={fullOpacityMissing ? i18n[lang].ui.fullOpacityOn : i18n[lang].ui.fullOpacityOff}
          >
            {fullOpacityMissing ? <CheckCheck size={20} /> : <Check size={20} />}
          </button>
          <button
            className={`px-4 py-2 rounded-xl transition shadow-sm ${dragSelectEnabled ? 'bg-indigo-500 text-white hover:bg-indigo-600' : theme === 'dark' ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-400 text-white hover:bg-gray-500'}`}
            onClick={() => setDragSelectEnabled(v => !v)}
            title={dragSelectEnabled ? i18n[lang].ui.dragSelectOn : i18n[lang].ui.dragSelectOff}
          >
            <Hand size={20} />
          </button>
          <button
            className={`px-4 py-2 rounded-xl transition shadow-sm ${cachingMode ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-green-500 text-white hover:bg-green-600'}`}
            onClick={() => setCachingMode(c => !c)}
            title={cachingMode ? i18n[lang].ui.cacheOn : i18n[lang].ui.cacheOff}
          >
            <Router size={20} />
          </button>
          <button 
            className={`px-4 py-2 rounded-xl font-bold transition shadow-sm ${theme === 'dark' ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-300 text-black hover:bg-gray-400'}`}
            onClick={() => setLang(l => l === "en" ? "ja" : "en")}
          >
            {lang === "en" ? "JA" : "EN"}
          </button>
          <button className={`px-4 py-2 rounded-xl transition shadow-sm ${theme === 'dark' ? 'bg-yellow-500 text-black hover:bg-yellow-400' : 'bg-blue-500 text-white hover:bg-blue-600'}`} onClick={() => setTheme(t => t === "light" ? "dark" : "light")}>
            {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
          </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 min-h-[50vh]">
        {categories.map(cat => renderMainCard(cat))}
      </div>

      <AnimatePresence>
        {active && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/75 flex justify-center items-center z-50 p-2 sm:p-4" onClick={(e) => { if (e.target === e.currentTarget) { setActive(null); setSelectionMode("none"); setShowUndo(false); setUndoState(null); setFilterMode("all"); } }}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className={`rounded-2xl shadow-2xl w-full max-w-7xl h-[90vh] max-h-[90vh] overflow-hidden flex flex-col md:flex-row ${theme === 'dark' ? 'bg-[#0a0f1d] text-white' : 'bg-white text-black'}`}>
              
              <div className={`w-full md:w-1/4 p-4 border-b md:border-b-0 md:border-r flex flex-col gap-3 overflow-y-auto sticky top-0 md:relative z-20 shrink-0 max-h-[45vh] md:max-h-full shadow-sm md:shadow-none ${
                theme === 'dark' ? 'bg-[#111a36] border-gray-800 text-white' : 'bg-[#e2e8f0] border-gray-300 text-black'
              }`}>
                <div className="flex flex-col gap-1">
                  <h2 className={`text-xl font-bold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{i18n[lang].categories[active.label] || active.label}</h2>
                  {active.special !== "generate" && (
                    <div className={`text-xs font-bold mt-0.5 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-400'}`}>
                      {i18n[lang].ui.categoryProgress} {getCategoryProgress(active).owned}/{getCategoryProgress(active).total} ({getCategoryProgress(active).percentage}%)
                    </div>
                  )}
                </div>

                {(active.label === "Bond CEs" ||
                  active.label === "Chocolate" ||
                  active.label === "Commemorative" ||
                  active.label === "Event free" ||
                  (active.raritySplit && active.special !== "generate")) && (
                    <div className={`w-full p-1.5 rounded-xl flex items-center justify-around shadow-sm border my-1 ${
                      theme === 'dark' ? 'bg-[#0a0f1d] border-gray-800' : 'bg-white border-gray-200'
                    }`}>
                      <button onClick={() => setSortAsc((prev) => !prev)} className={`p-2 rounded-lg transition ${theme === 'dark' ? 'text-gray-300 hover:bg-[#111a36]' : 'text-gray-700 hover:bg-gray-200'}`} title={sortAsc ? i18n[lang].ui.sortDescending : i18n[lang].ui.sortAscending}>
                        {sortAsc ? <ArrowDownNarrowWide size={20} /> : <ArrowUpNarrowWide size={20} />}
                      </button>
                      <button
                        onClick={() => setFilterMode(f => f === 'all' ? 'missing' : f === 'missing' ? 'completed' : 'all')}
                        className={`p-2 rounded-lg transition ${theme === 'dark' ? 'text-gray-300 hover:bg-[#111a36]' : 'text-gray-700 hover:bg-gray-200'}`}
                        title={i18n[lang].ui.filterItems}
                      >
                        {filterMode === 'all' ? <Folder size={20} /> : filterMode === 'missing' ? <FolderMinus size={20} /> : <FolderPlus size={20} />}
                      </button>
                      <button
                        onClick={() => setItemSize(s => s === 72 ? 100 : s === 100 ? 48 : 72)}
                        className={`p-2 rounded-lg transition ${theme === 'dark' ? 'text-gray-300 hover:bg-[#111a36]' : 'text-gray-700 hover:bg-gray-200'}`}
                        title={i18n[lang].ui.changeItemSize}
                      >
                        <ZoomIn size={20} />
                      </button>
                    </div>
                  )
                }

                <div className="grid grid-cols-2 md:flex md:flex-col gap-2 mt-1">
                  {active.special !== "generate" && !isViewingShared && (
                    <>
                      <button className="px-3 py-2 text-xs md:text-sm font-semibold rounded-xl bg-green-600 hover:bg-green-500 text-white transition shadow-xs" onClick={() => markAll(getItems(active), true)}>{i18n[lang].ui.markAllHave}</button>
                      <button className="px-3 py-2 text-xs md:text-sm font-semibold rounded-xl bg-yellow-600 hover:bg-yellow-500 text-white transition shadow-xs" onClick={() => markAll(getItems(active), false)}>{i18n[lang].ui.markAllDontHave}</button>
                      <button className={`px-3 py-2 text-xs md:text-sm font-semibold rounded-xl border transition shadow-xs ${selectionMode === "looking" ? "bg-blue-600 border-blue-600 text-white" : theme === 'dark' ? "bg-[#0a0f1d] text-white border-gray-700 hover:bg-[#111a36]" : "bg-white text-black border-gray-300 hover:bg-gray-50"}`} onClick={() => setSelectionMode(s => s === "looking" ? "none" : "looking")}>{i18n[lang].ui.lookingFor}</button>
                      <button className={`px-3 py-2 text-xs md:text-sm font-semibold rounded-xl border transition shadow-xs ${selectionMode === "offering" ? "bg-blue-600 border-blue-600 text-white" : theme === 'dark' ? "bg-[#0a0f1d] text-white border-gray-700 hover:bg-[#111a36]" : "bg-white text-black border-gray-300 hover:bg-gray-50"}`} onClick={() => setSelectionMode(s => s === "offering" ? "none" : "offering")}>{i18n[lang].ui.offering}</button>
                    </>
                  )}
                  {active.special !== "generate" && showUndo && (
                    <button
                      className="col-span-2 md:col-span-1 px-3 py-2 text-xs md:text-sm font-semibold rounded-xl bg-pink-600 text-white hover:bg-pink-500 transition shadow-xs"
                      onClick={() => {
                        if (undoState) {
                          setCollection(prev => ({ ...prev, ...undoState }));
                          setUndoState(null);
                          setShowUndo(false);
                        }
                      }}
                    >
                      {i18n[lang].ui.undoChange}
                    </button>
                  )}
                  {active.special === "generate" && lastId && !isViewingShared && (
                    <button className={`col-span-2 md:col-span-1 px-3 py-2 text-xs md:text-sm font-semibold rounded-xl transition shadow-xs ${theme === 'dark' ? 'bg-purple-700 text-white hover:bg-purple-600' : 'bg-purple-600 text-white hover:bg-purple-500'}`} onClick={() => setGenUserId(lastId)}>{i18n[lang].ui.pasteLastId} ({lastId})</button>
                  )}
                  <button className="col-span-2 md:col-span-1 px-3 py-2 text-xs md:text-sm font-semibold rounded-xl bg-red-600 hover:bg-red-500 text-white transition shadow-xs" onClick={() => { setActive(null); setSelectionMode("none"); setShowUndo(false); setUndoState(null); setFilterMode("all"); }}>{i18n[lang].ui.close}</button>
                </div>
              </div>

              {active.special === "generate" ? (
                <div className={`flex-1 p-6 overflow-y-auto ${theme === 'dark' ? 'bg-[#0a0f1d] text-white' : 'bg-white text-black'}`}>
                  {isViewingShared ? (
                    <>
                      <h3 className="text-lg font-bold mb-2">{i18n[lang].ui.previewLooking} {viewLookingFor === "ALL" ? `(${data.filter(d => !viewCollection[d.id]).length} ${i18n[lang].ui.itemsCount})` : ""}</h3>
                      <SmallList map={viewLookingFor} listName="looking" expandAll="looking" dataCollection={viewCollection} />
                      <h3 className="text-lg font-bold mt-4 mb-2">{i18n[lang].ui.previewOffering} {viewOffering === "ALL" ? `(${Object.keys(viewCollection).filter(k => viewCollection[k]).length} ${i18n[lang].ui.itemsCount})` : ""}</h3>
                      <SmallList map={viewOffering} listName="offering" expandAll="offering" dataCollection={viewCollection} />
                      <div className={`mt-6 font-semibold border-t pt-4 ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}>{i18n[lang].ui.overallProgress} {getProgress().owned}/{getProgress().total}</div>
                      <p className="mt-2 text-sm text-gray-400">{i18n[lang].ui.viewingOnly}</p>
                    </>
                  ) : (
                    <>
                      <h2 className="text-lg font-bold mb-2">{i18n[lang].ui.shareCollection}</h2>
                      <p className={`text-sm mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>{i18n[lang].ui.shareInstructions}</p>
                      <input type="text" value={genUserId} onChange={e => setGenUserId(e.target.value.replace(/[^\d]/g, ''))} className={`w-full p-2 mb-3 rounded-xl border ${theme === 'dark' ? 'bg-[#111a36] text-white border-gray-700' : 'bg-white text-black border-gray-300'}`} placeholder="012345678" />
                      <div className="flex flex-wrap gap-2 mb-3">
                        <button className="px-4 py-2 rounded-xl bg-blue-500 text-white hover:bg-blue-600 transition shadow-sm" onClick={() => { if (!/^(?:\d{9}|\d{12})$/.test(genUserId)) { alert(i18n[lang].ui.invalidId); return; } setLastId(genUserId); const url = generateLink(genUserId); debugLink(url); setGeneratedUrl(url); try { navigator.clipboard.writeText(url); } catch { } }}>{i18n[lang].ui.generateHash}</button>
                        <button className={`px-4 py-2 rounded-xl transition shadow-sm ${theme === 'dark' ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-300 text-black hover:bg-gray-400'}`} onClick={() => { setGenUserId(''); setGeneratedUrl(''); }}>{i18n[lang].ui.clear}</button>
                        <button
                          className={`px-4 py-2 rounded-xl transition shadow-sm ${generatedUrl.endsWith("/open")
                            ? "bg-indigo-600 text-white hover:bg-indigo-500"
                            : theme === 'dark' ? "bg-[#111a36] text-white border border-gray-700 hover:bg-[#1f2e54]" : "bg-indigo-200 text-black hover:bg-indigo-300"
                            }`}
                          onClick={() => {
                            if (!/^(?:\d{9}|\d{12})$/.test(genUserId)) {
                              alert(i18n[lang].ui.invalidId);
                              return;
                            }

                            setLastId(genUserId);

                            const currentlyOpen = generatedUrl.endsWith("/open");
                            const url = generateLink(genUserId, !currentlyOpen);

                            setGeneratedUrl(url);

                            try {
                              navigator.clipboard.writeText(url);
                            } catch { }
                          }}
                        >
                          {i18n[lang].ui.pointToTradeHub}
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-3 mb-4">
                        <button className={`px-3 py-2 rounded-xl text-xs font-semibold transition shadow-xs ${offerAll ? "bg-blue-600 text-white" : theme === 'dark' ? "bg-[#111a36] text-white border border-gray-700 hover:bg-[#1f2e54]" : "bg-blue-100 text-black hover:bg-blue-200"}`} onClick={() => { setOfferAll(v => !v); if (!offerAll) setOffering({}); }}>{offerAll ? i18n[lang].ui.undoOfferEverything : i18n[lang].ui.offerEverything}</button>
                        <button className={`px-3 py-2 rounded-xl text-xs font-semibold transition shadow-xs ${lookingAll ? "bg-blue-600 text-white" : theme === 'dark' ? "bg-[#111a36] text-white border border-gray-700 hover:bg-[#1f2e54]" : "bg-blue-100 text-black hover:bg-blue-200"}`} onClick={() => { setLookingAll(v => !v); if (!lookingAll) setLookingFor({}); }}>{lookingAll ? i18n[lang].ui.undoLookingEverything : i18n[lang].ui.lookingEverything}</button>
                      </div>
                      {generatedUrl && <div className={`mt-4 p-3 border rounded-xl cursor-pointer transition shadow-xs ${theme === 'dark' ? 'bg-green-950/40 border-green-800 hover:bg-green-900/60' : 'bg-green-100 border-green-200 hover:bg-green-200'}`} onClick={() => { navigator.clipboard.writeText(generatedUrl); }}><p className="text-sm font-semibold mb-1">{i18n[lang].ui.yourLink}</p><p className={`break-all text-sm font-mono ${theme === 'dark' ? 'text-green-300' : 'text-green-700'}`}>{generatedUrl}</p></div>}
                      <div className={`mt-6 p-3 border rounded-xl text-sm ${theme === 'dark' ? 'bg-yellow-950/30 border-yellow-800 text-yellow-200' : 'bg-yellow-100 border-yellow-200 text-yellow-800'}`}><p className="mb-1 font-semibold">{i18n[lang].ui.tips}</p><ul className="list-disc pl-5 space-y-1"><li>{i18n[lang].ui.tip1}</li><li>{i18n[lang].ui.tip2}</li><li>{i18n[lang].ui.tip3}</li></ul></div>
                      
                      <div className="mt-6 space-y-6">
                        <div>
                          <h4 className={`font-bold text-lg mb-2 border-b pb-1 ${theme === 'dark' ? 'text-white border-gray-800' : 'text-gray-900 border-gray-200'}`}>{i18n[lang].ui.previewLooking} {lookingAll ? `(${data.filter(d => !collection[d.id]).length} ${i18n[lang].ui.itemsCount})` : ""}</h4>
                          <SmallList map={lookingAll ? "ALL" : lookingFor} listName="looking" expandAll="looking" dataCollection={collection} />
                        </div>
                        <div>
                          <h4 className={`font-bold text-lg mb-2 border-b pb-1 ${theme === 'dark' ? 'text-white border-gray-800' : 'text-gray-900 border-gray-200'}`}>{i18n[lang].ui.previewOffering} {offerAll ? `(${Object.keys(collection).filter(k => collection[k]).length} ${i18n[lang].ui.itemsCount})` : ""}</h4>
                          <SmallList map={offerAll ? "ALL" : offering} listName="offering" expandAll="offering" dataCollection={collection} />
                        </div>
                      </div>
                      <div className={`mt-6 font-semibold border-t pt-4 ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}>{i18n[lang].ui.overallProgress} {getProgress().owned}/{getProgress().total}</div>
                    </>
                  )}
                </div>
              ) : (
                (() => {
                  const items = getItems(active).sort((a, b) => a.collectionNo - b.collectionNo);
                  const renderWithSubcategories = (items, subs) => {
                    const sortedSubs = sortAsc ? subs : [...subs].reverse();
                    const used = new Set();
                    return (
                      <div className={`flex-1 p-4 overflow-y-auto ${theme === 'dark' ? 'bg-[#0a0f1d]' : 'bg-white'}`}>
                        {sortedSubs.map((sub) => {
                          const subItems = items.filter(it => it.collectionNo >= sub.range[0] && it.collectionNo <= sub.range[1]);
                          subItems.forEach((si) => used.add(si.id));
                          return renderSection(sub.label, subItems);
                        })}
                        {(() => { const rest = items.filter((it) => !used.has(it.id)); return renderSection("The rest", rest); })()}
                      </div>
                    );
                  };
                  const renderByRarity = (items) => { const rarities = sortAsc ? [5, 4, 3, 2, 1] : [1, 2, 3, 4, 5]; return (<div className={`flex-1 p-4 overflow-y-auto ${theme === 'dark' ? 'bg-[#0a0f1d]' : 'bg-white'}`}> {rarities.map((r) => renderSection(`Rarity ${r}`, items.filter((it) => it.rarity === r)))} </div>); }; 
                  if (active.label === "Bond CEs") return renderWithSubcategories(items, bondSubcategories); 
                  if (active.label === "Chocolate") return renderWithSubcategories(items, chocolateSubcategories); 
                  if (active.label === "Commemorative") return renderWithSubcategories(items, commemorativeSubcategories);
                  if (active.label === "Event free") {
                    const rarities = sortAsc ? [5, 4, 3] : [3, 4, 5];
                    const subFlags = [{ key: "svtEquipEventReward", label: i18n[lang].ui.eventReward }, { key: "svtEquipExp", label: i18n[lang].ui.ceExp }];
                    return (
                      <div className={`flex-1 p-4 overflow-y-auto ${theme === 'dark' ? 'bg-[#0a0f1d]' : 'bg-white'}`}>
                        {rarities.map(r => (
                          (() => {
                            const rarityItems = items.filter(it => it.rarity === r);
                            if (rarityItems.length === 0) return null;
                            const rarityProgress = {
                              owned: rarityItems.filter(it => mapOwned(it.id)).length,
                              total: rarityItems.length
                            };
                            let displayRarityTitle = `${i18n[lang].ui.rarity} ${r}`;
                            if (filterMode === 'missing') {
                              displayRarityTitle = `${displayRarityTitle}${i18n[lang].ui.missingSuffix}`;
                            } else if (filterMode === 'completed') {
                              displayRarityTitle = `${displayRarityTitle}${i18n[lang].ui.haveSuffix}`;
                            }
                            return (
                              <div key={r}>
                                <div className="flex justify-between items-center my-4">
                                  <h3 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{displayRarityTitle}</h3>
                                  <span className={`text-sm font-semibold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{rarityProgress.owned} / {rarityProgress.total}</span>
                                </div>
                                {subFlags.map(sf => {
                                  const subs = rarityItems.filter(it => it.flag === sf.key || (Array.isArray(it.flags) && it.flags.includes(sf.key)));
                                  if (!subs.length) return null;
                                  const subProgress = {
                                    owned: subs.filter(it => mapOwned(it.id)).length,
                                    total: subs.length
                                  };
                                  let displaySubFlagTitle = sf.label;
                                  if (filterMode === 'missing') {
                                    displaySubFlagTitle = `${displaySubFlagTitle}${i18n[lang].ui.missingSuffix}`;
                                  } else if (filterMode === 'completed') {
                                    displaySubFlagTitle = `${displaySubFlagTitle}${i18n[lang].ui.haveSuffix}`;
                                  }
                                  const allComplete = subs.every(it => mapOwned(it.id));
                                  const visibleSubs = subs.filter(it => {
                                    if (filterMode === 'missing') return !mapOwned(it.id);
                                    if (filterMode === 'completed') return mapOwned(it.id);
                                    return true;
                                  });
                                  return (
                                    <div key={sf.key} className="mb-6">
                                      <div className="flex justify-between items-center mb-1">
                                        <h4 className={`text-md font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{displaySubFlagTitle}</h4>
                                        <span className={`text-xs font-semibold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{subProgress.owned} / {subProgress.total}</span>
                                      </div>
                                      {!isViewingShared && <p className="text-sm text-blue-500 hover:underline cursor-pointer mb-2" onClick={() => markAll(subs, !allComplete)}>{allComplete ? i18n[lang].ui.undoSubcategory : i18n[lang].ui.completeSubcategory}</p>}
                                      <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${itemSize}px, 1fr))` }}>
                                        {visibleSubs.length > 0
                                          ? visibleSubs.map(it => (
                                            <CECell
                                              key={it.id}
                                              item={it}
                                              bondFace={bondCeMap.byCollectionNo[it.collectionNo]?.face}
                                              dragSelectEnabled={dragSelectEnabled}
                                              cachingMode={cachingMode}
                                              owned={mapOwned(it.id)}
                                              isPulse={highlightId === it.id}
                                              isAffected={isDragging && (mapOwned(it.id) !== !!collectionSnapshot.current[it.id])}
                                              itemSize={itemSize}
                                              isViewingShared={isViewingShared}
                                              selectionMode={selectionMode}
                                              filterMode={filterMode}
                                              onItemClick={onItemClick}
                                              onDragStart={handleDragStart}
                                              onDragOver={handleDragOver}
                                              onToggle={handleToggle}
                                              fullOpacityMissing={fullOpacityMissing}
                                              theme={theme}
                                              lang={lang}
                                            />
                                          ))
                                          : <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                            {i18n[lang].ui.noItemsMatch}
                                          </div>
                                        }
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          })()
                        ))}
                      </div>
                    );
                  }
                  if (active.raritySplit) return renderByRarity(items);
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