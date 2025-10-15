// --- 1. LOAD JSON VIA FETCH ---
document.addEventListener("DOMContentLoaded", () => {
  fetch("settings.json") // Path to your JSON file (same repo / root folder)
    .then((response) => response.json())
    .then((settingsData) => {
      // --- 2. CONTINUE WITH YOUR EXISTING LOGIC ---

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

      searchInput.addEventListener("input", () => {
        const query = searchInput.value.trim();
        if (query === "") {
          resultsContainer.innerHTML = "";
          return;
        }
        const searchResults = fuse.search(query).map((res) => res.item);
        displayResults(searchResults);
      });
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

function displayResults(results) {
  const resultsContainer = document.getElementById("resultsContainer");
  resultsContainer.innerHTML = "";
  if (results.length === 0) {
    resultsContainer.innerHTML =
      '<div class="result-item no-results">No settings found. Try a different search term.</div>';
    return;
  }
  results.forEach((result, index) => {
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
