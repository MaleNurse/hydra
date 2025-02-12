import { createContext, useContext, useEffect, useState } from "react";
import { Alert } from "react-native";

import { AccountContext } from "./AccountContext";
import {
  addToMulti,
  getMyMultis,
  Multi,
  removeFromMulti,
} from "../api/Multireddit";
import {
  Subreddit,
  Subreddits as SubredditsObj,
  getSubreddits,
  getTrending,
  setSubscriptionStatus,
} from "../api/Subreddits";
import KeyStore from "../utils/KeyStore";

type SubredditContextType = {
  isLoadingSubreddits: boolean;
  subreddits: SubredditsObj;
  multis: Multi[];
  subscribe: (subreddit: string) => Promise<void>;
  unsubscribe: (subreddit: string) => Promise<void>;
  toggleFavorite: (subreddit: string) => Promise<void>;
  addSubToMulti: (
    multi: Multi,
    subredditName: Subreddit["name"],
  ) => Promise<void>;
  deleteSubFromMulti: (
    multi: Multi,
    subredditName: Subreddit["name"],
  ) => Promise<void>;
};

const initialAccountContext: SubredditContextType = {
  isLoadingSubreddits: true,
  subreddits: {
    favorites: [],
    moderator: [],
    subscriber: [],
    trending: [],
  },
  multis: [],
  subscribe: async () => {},
  unsubscribe: async () => {},
  toggleFavorite: async () => {},
  addSubToMulti: async () => {},
  deleteSubFromMulti: async () => {},
};

export const SubredditContext = createContext(initialAccountContext);

export class NeedsLoginToFavorite extends Error {
  constructor() {
    super("You must be logged in to favorite subreddits");
  }
}

export class NeedsSubscriptionToFavorite extends Error {
  constructor() {
    super("You must be subscribed to a subreddit to favorite it");
  }
}

export function SubredditProvider({ children }: React.PropsWithChildren) {
  const { currentUser } = useContext(AccountContext);

  const [subreddits, setSubreddits] = useState(
    initialAccountContext.subreddits,
  );
  const [isLoadingSubreddits, setIsLoadingSubreddits] = useState(true);

  const [multis, setMultis] = useState<Multi[]>([]);

  const getStorageKey = () => {
    if (!currentUser) {
      alert("You must be logged in to favorite subreddits");
      throw new NeedsLoginToFavorite();
    }
    return `favoriteSubreddits:${currentUser.id}`;
  };

  const getFavoriteSubNames = async (): Promise<string[]> => {
    const favs = KeyStore.getString(getStorageKey());
    return favs ? JSON.parse(favs) : [];
  };

  const toggleFavorite = async (subredditName: string): Promise<void> => {
    try {
      const subToFavorite = subreddits.subscriber.find(
        (sub) => sub.name === subredditName,
      );
      if (!subToFavorite) {
        throw new NeedsSubscriptionToFavorite();
      }

      const currentFavorites = await getFavoriteSubNames();
      const isFavorite = currentFavorites.includes(subredditName);

      let newFavorites: string[];
      let newFavoriteSubs: Subreddit[];
      if (isFavorite) {
        newFavorites = currentFavorites.filter(
          (name) => name !== subredditName,
        );
        newFavoriteSubs = subreddits.favorites.filter(
          (fav) => fav.name !== subredditName,
        );
      } else {
        newFavorites = [...currentFavorites, subredditName];
        newFavoriteSubs = [...subreddits.favorites, subToFavorite];
      }

      KeyStore.set(getStorageKey(), JSON.stringify(newFavorites));
      setSubreddits({
        ...subreddits,
        favorites: newFavoriteSubs,
      });
    } catch (e) {
      if (e instanceof NeedsLoginToFavorite) {
        return;
      }
      throw e;
    }
  };

  const loadSubreddits = async () => {
    if (currentUser) {
      const favoriteSubNames = await getFavoriteSubNames();
      const subreddits = await getSubreddits();
      const favorites = subreddits.subscriber.filter((sub) =>
        favoriteSubNames.includes(sub.name),
      );
      setSubreddits({
        ...subreddits,
        favorites,
      });
    } else {
      setSubreddits({
        favorites: [],
        moderator: [],
        subscriber: [],
        trending: await getTrending({ limit: "30" }),
      });
    }
  };

  const loadMultis = async () => {
    if (currentUser) {
      const multis = await getMyMultis();
      setMultis(multis);
    } else {
      setMultis([]);
    }
  };

  const subscribe = async (subreddit: string) => {
    await setSubscriptionStatus(subreddit, true);
    loadSubreddits();
    Alert.alert(
      "Subscribed!",
      "You've successfully subscribed to " + subreddit,
    );
  };

  const unsubscribe = async (subreddit: string) => {
    await setSubscriptionStatus(subreddit, false);
    loadSubreddits();
    alert("Unsubscribed from " + subreddit);
  };

  const addSubToMulti = async (
    multi: Multi,
    subredditName: Subreddit["name"],
  ) => {
    try {
      await addToMulti(multi, subredditName);
      loadMultis();
      alert(`Added ${subredditName} to ${multi.name}`);
    } catch (e) {
      alert("Something went wrong: " + e);
    }
  };

  const deleteSubFromMulti = async (
    multi: Multi,
    subredditName: Subreddit["name"],
  ) => {
    try {
      await removeFromMulti(multi, subredditName);
      loadMultis();
      alert(`Removed ${subredditName} from ${multi.name}`);
    } catch (e) {
      alert("Something went wrong: " + e);
    }
  };

  const loadData = async () => {
    setIsLoadingSubreddits(true);
    await loadSubreddits();
    await loadMultis();
    setIsLoadingSubreddits(false);
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  return (
    <SubredditContext.Provider
      value={{
        isLoadingSubreddits,
        subreddits,
        multis,
        subscribe,
        unsubscribe,
        toggleFavorite,
        addSubToMulti,
        deleteSubFromMulti,
      }}
    >
      {children}
    </SubredditContext.Provider>
  );
}
