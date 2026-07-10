import { useContext } from "react";
import { AppContext } from "./appContextValue";

export function useAppContext() {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error(
      "useAppContext muss innerhalb von AppProvider verwendet werden.",
    );
  }

  return context;
}