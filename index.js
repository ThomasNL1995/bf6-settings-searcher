let currentFullResults = [];
let currentlyDisplayedCount = 0;
const RESULTS_PER_PAGE = 20;

document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("searchInput");
  const resultsContainer = document.getElementById("resultsContainer");
  const filterContainer = document.getElementById("filterContainer");
  const loadMoreBtn = document.getElementById("loadMoreBtn");

  fetch("BF6_SETTINGS.json") // Keep your original relative path
    .then((response) => {
      console.log("Fetch Response Status:", response.status);
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }
      return response.json();
    })
    .then((settingsData) => {
      console.log("Loaded settingsData:", settingsData);

      // Flatten nested settings into a searchable list
      const flatSettings = flattenSettings(settingsData);

      // Fuse.js search options
      const fuseOptions = {
        keys: [
          { name: "settingName", weight: 0.8 },
          { name: "pathOnly", weight: 0.2 },
        ],
        includeScore: true,
        threshold: 0.4,
        ignoreLocation: true,
      };

      const fuse = new Fuse(flatSettings, fuseOptions);

      // Dynamically create filter checkboxes
      const mainTabs = Object.keys(settingsData);
      mainTabs.forEach((tab) => {
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.id = `filter-${tab}`;
        checkbox.className = "filter-checkbox";
        checkbox.value = tab;

        const label = document.createElement("label");
        label.htmlFor = `filter-${tab}`;
        label.className = "filter-label";
        label.textContent = tab.replace(/_/g, " ");

        filterContainer.appendChild(checkbox);
        filterContainer.appendChild(label);
      });

      const resetBtn = document.createElement("button");
      resetBtn.id = "resetFiltersBtn";
      resetBtn.textContent = "Reset Filters";
      filterContainer.appendChild(resetBtn);

      // Add Reset Filters button
      resetBtn.addEventListener("click", () => {
        document
          .querySelectorAll(".filter-checkbox")
          .forEach((cb) => (cb.checked = false));
        performSearch(); // refresh results after clearing filters
      });

      function performSearch() {
        const query = searchInput.value;
        const checkedFilters = Array.from(
          document.querySelectorAll(".filter-checkbox:checked")
        );
        const selectedFilterValues = checkedFilters.map((cb) => cb.value);

        resetBtn.classList.toggle("visible", checkedFilters.length > 0);

        resultsContainer.innerHTML = ""; // Clear container for new search
        currentlyDisplayedCount = 0; // Reset display count

        if (query.trim() === "" && selectedFilterValues.length === 0) {
          document.getElementById("loadMoreContainer").style.display = "none";
          return;
        }

        let searchResults =
          query.trim() === ""
            ? flatSettings.map((item) => ({ item }))
            : fuse.search(query);

        let filteredResults = searchResults.map((result) => result.item);
        if (selectedFilterValues.length > 0) {
          filteredResults = filteredResults.filter((item) =>
            selectedFilterValues.includes(item.tab)
          );
        }

        currentFullResults = filteredResults; // Store all results

        if (currentFullResults.length === 0) {
          resultsContainer.innerHTML =
            '<div class="result-item no-results">No settings found. Adjust your search or filters.</div>';
          document.getElementById("loadMoreContainer").style.display = "none";
        } else {
          handleLoadMore(); // Display the first batch
        }
      }

      // Trigger search on input and filter changes
      searchInput.addEventListener("input", performSearch);
      filterContainer.addEventListener("change", performSearch);
      loadMoreBtn.addEventListener("click", handleLoadMore);
    })
    .catch((error) => {
      console.error("Error loading settings.json:", error);
      document.getElementById("resultsContainer").innerHTML =
        '<div class="result-item error">Failed to load settings data.</div>';
    });
});

// Flatten settings and add `tab` for filtering
function flattenSettings(obj, path = [], flatList = []) {
  for (const key of Object.keys(obj)) {
    const newPath = [...path, key];
    if (
      typeof obj[key] === "object" &&
      obj[key] !== null &&
      Object.keys(obj[key]).length > 0
    ) {
      flattenSettings(obj[key], newPath, flatList);
    } else if (typeof obj[key] !== "object" || obj[key] === null) {
      const settingName = key;
      const pathOnly = path.join(" > ");
      flatList.push({
        path: newPath.join(" > "),
        settingName: settingName,
        pathOnly: pathOnly,
        tab: path[0] || null, // main category for filtering
      });
    }
  }
  return flatList;
}
function appendResults(results) {
  const resultsContainer = document.getElementById("resultsContainer");

  results.forEach((result) => {
    const pathParts = result.path.split(" > ");
    const settingName = pathParts.pop();
    const pathOnly = pathParts.join(" > ");

    const itemDiv = document.createElement("div");
    itemDiv.className = "result-item";
    // Animation delay is based on total displayed count for smooth loading
    itemDiv.style.animationDelay = `${(currentlyDisplayedCount + 1) * 0.03}s`;

    const pathElement = document.createElement("span");
    pathElement.className = "result-path";
    pathElement.innerHTML = `${pathOnly} > <strong>${settingName}</strong>`;

    itemDiv.appendChild(pathElement);
    resultsContainer.appendChild(itemDiv);
  });
}

function handleLoadMore() {
  const loadMoreContainer = document.getElementById("loadMoreContainer");
  const resultsToDisplay = currentFullResults.slice(
    currentlyDisplayedCount,
    currentlyDisplayedCount + RESULTS_PER_PAGE
  );

  appendResults(resultsToDisplay);
  currentlyDisplayedCount += resultsToDisplay.length;

  if (currentlyDisplayedCount < currentFullResults.length) {
    loadMoreContainer.style.display = "block";
  } else {
    loadMoreContainer.style.display = "none";
  }
}

// Display search results with maxResults default 20
function displayResults(results, maxResults = 20) {
  const resultsContainer = document.getElementById("resultsContainer");
  resultsContainer.innerHTML = "";

  if (results.length === 0) {
    resultsContainer.innerHTML =
      '<div class="result-item no-results">No settings found. Try a different search term.</div>';
    return;
  }

  const limitedResults = results.slice(0, maxResults);

  limitedResults.forEach((result, index) => {
    const pathParts = result.path.split(" > ");
    const settingName = pathParts.pop();
    const pathOnly = pathParts.join(" > ");

    const itemDiv = document.createElement("div");
    itemDiv.className = "result-item";
    itemDiv.style.animationDelay = `${index * 0.05}s`;

    const pathElement = document.createElement("span");
    pathElement.className = "result-path";
    pathElement.innerHTML = `${pathOnly} > <strong>${settingName}</strong>`;

    itemDiv.appendChild(pathElement);
    resultsContainer.appendChild(itemDiv);
  });
}
