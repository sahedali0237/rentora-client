(function () {
  try {
    var theme = localStorage.getItem("theme");
    var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (theme === "dark" || (!theme && prefersDark)) {
      document.documentElement.classList.add("dark");
    }
  } catch (e) {
    // storage or media-query access may fail (e.g. private mode);
    // in that case just leave the page in its default light theme.
  }
})();
