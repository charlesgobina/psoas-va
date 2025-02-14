const extractLocation = (url) => {
  const match = url.match(/\/locations\/([^/]+)/);
  return match ? match[1] : null;
}

export { extractLocation };
