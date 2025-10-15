document.addEventListener("DOMContentLoaded", () => {
  fetch("BF6_SETTINGS.json")
    .then((response) => {
      console.log("Fetch Response Status:", response.status);
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }
      return response.json();
    })
    .then((settingsData) => {
      console.log("Loaded settingsData:", settingsData); // should log your JSON
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

      const searchInput = document.getElementById("searchInput");
      const resultsContainer = document.getElementById("resultsContainer");
      const filterContainer = document.getElementById("filterContainer");

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

      function performSearch() {
        const query = searchInput.value;

        // Get selected filters
        const checkedFilters = Array.from(
          document.querySelectorAll(".filter-checkbox:checked")
        ).map((cb) => cb.value);

        if (query.trim() === "" && checkedFilters.length === 0) {
          resultsContainer.innerHTML = ""; // Clear if no query and no filters
          return;
        }

        // Step 1: Perform fuzzy search
        let searchResults =
          query.trim() === ""
            ? flatSettings.map((item) => ({ item })) // If no query, start with all settings
            : fuse.search(query);

        // Step 2: Apply filters if any are selected
        let filteredResults = searchResults.map((result) => result.item);
        if (checkedFilters.length > 0) {
          filteredResults = filteredResults.filter((item) =>
            checkedFilters.includes(item.tab)
          );
        }

        displayResults(filteredResults);
      }

      // Trigger search on both input and filter changes
      searchInput.addEventListener("input", performSearch);
      filterContainer.addEventListener("change", performSearch);
    })
    .catch((error) => {
      console.error("Error loading settings.json:", error);
      document.getElementById("resultsContainer").innerHTML =
        '<div class="result-item error">Failed to load settings data.</div>';
    });
});

// --- 3. YOUR EXISTING FUNCTIONS REMAIN UNCHANGED ---

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
      });
    }
  }
  return flatList;
}

function displayResults(results, maxResults = 20) {
  const resultsContainer = document.getElementById("resultsContainer");
  resultsContainer.innerHTML = "";

  if (results.length === 0) {
    resultsContainer.innerHTML =
      '<div class="result-item no-results">No settings found. Try a different search term.</div>';
    return;
  }

  // Only take up to maxResults
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
