### Description

**CEdex** is a responsive web application designed for *Fate/Grand Order* players to track, manage, and share their Craft Essence (CE) collection.

#### Visual & Interactive Collection

  * **Visual Grid System:** View your CEs as high-quality thumbnails in a responsive grid that adapts to any screen size.
  * **Interactions:**
      * **Single Tap:** Simple tap/click to toggle individual items.
      * **Drag-to-Select:** Quickly mark multiple items as owned by dragging across them (toggleable to prevent scrolling issues on mobile).
  * **Dynamic Animations:** Smooth transitions and pulse effects powered by `framer-motion` for a polished user experience.

#### Comprehensive Categorization

  * **Structured Library:** Organized into intuitive categories:
      * Bond CEs (sorted by year)
      * Valentine's Chocolate (sorted by year)
      * Commemorative/Campaign CEs (Anniversaries, Other Campaigns)
      * Event CEs (Gacha vs. Free/Shop)
      * Standard Pool & Mana Prism Shop
  * **Advanced Filtering:** Toggle views to see **All Items**, **Missing Items**, or **Owned Items**.
  * **Sorting:** Sort collections by ID/Number in Ascending or Descending order.

#### Sharing & Trading

  * **Read-Only Mode:** View other users' collections via their shared links without overwriting your own data.
  * **Shareable Links:** Generate a unique, compressed URL to share your entire collection progress with friends.
  * **Trade Management:** Dedicated "Looking For" and "Offering" modes to mark specific CEs you want or have available for trade/sharing.

#### Utility

  * **Instant Search:** Fast, real-time search by CE Name, ID, or original Japanese name. Works without pointing mouse cursor at the search bar.
  * **Zoom Levels:** Switch between three viewing sizes (Small, Medium, Large) to suit your preference.
  * **Dark/Light Mode:** Fully themed UI with a toggleable Dark Mode (default) for comfortable viewing.
  * **Atlas Academy Integration:** Fetches up-to-date game data dynamically from the Atlas Academy API.

#### Data & Performance

  * **Local Persistence:** Your collection progress, theme preference, and settings are automatically saved to your browser's local storage—no login required.
  * **Image Caching:** Optional "Caching Mode" (using `localforage`) downloads CE images to your device for faster loading and reduced bandwidth on subsequent visits.
  * **LZ-String Compression:** Efficient data handling for generating short sharing links.

