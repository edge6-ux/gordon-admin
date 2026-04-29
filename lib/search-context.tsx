"use client";

import { createContext, useContext, useState, useEffect } from "react";
import SearchModal from "@/components/layout/SearchModal";

type SearchContextType = {
  openSearch:  () => void;
  closeSearch: () => void;
};

const SearchContext = createContext<SearchContextType>({
  openSearch:  () => {},
  closeSearch: () => {},
});

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <SearchContext.Provider
      value={{
        openSearch:  () => setOpen(true),
        closeSearch: () => setOpen(false),
      }}
    >
      {children}
      <SearchModal open={open} onClose={() => setOpen(false)} />
    </SearchContext.Provider>
  );
}

export function useSearch() {
  return useContext(SearchContext);
}
