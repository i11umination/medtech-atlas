import { useEffect, useState } from "react";
import type { PreferenceOption } from "../lib/types";

interface SavedPreferences {
  role: string;
  interests: string[];
}

const STORAGE_KEY = "med-tech-preferences-v1";

export default function PreferencePanel({
  options,
}: {
  options: PreferenceOption[];
}) {
  const roles = options.filter((option) => option.category === "role");
  const interests = options.filter(
    (option) => option.category === "research_interest",
  );
  const [preferences, setPreferences] = useState<SavedPreferences>({
    role: "",
    interests: [],
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    try {
      setPreferences(JSON.parse(stored) as SavedPreferences);
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const toggleInterest = (value: string) => {
    setSaved(false);
    setPreferences((current) => ({
      ...current,
      interests: current.interests.includes(value)
        ? current.interests.filter((item) => item !== value)
        : [...current.interests, value],
    }));
  };

  const save = () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    window.dispatchEvent(
      new CustomEvent("med-tech-preferences-updated", {
        detail: preferences,
      }),
    );
    setSaved(true);
  };

  const clear = () => {
    const empty = { role: "", interests: [] };
    setPreferences(empty);
    window.localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(
      new CustomEvent("med-tech-preferences-updated", { detail: empty }),
    );
    setSaved(false);
  };

  return (
    <details className="preference-panel">
      <summary>
        <span>设置阅读偏好</span>
        <small>可跳过 · 仅保存在本机</small>
      </summary>
      <div className="preference-body">
        <fieldset>
          <legend>你更接近哪类读者？</legend>
          <div className="option-grid role-grid">
            {roles.map((role) => (
              <label className="choice-card" key={role.id}>
                <input
                  type="radio"
                  name="reader-role"
                  value={role.value}
                  checked={preferences.role === role.value}
                  onChange={() => {
                    setSaved(false);
                    setPreferences((current) => ({
                      ...current,
                      role: role.value,
                    }));
                  }}
                />
                <span>
                  <strong>{role.label}</strong>
                  <small>{role.description}</small>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend>希望优先看到哪些研究方向？</legend>
          <div className="option-grid interest-grid">
            {interests.map((interest) => (
              <label className="choice-chip" key={interest.id}>
                <input
                  type="checkbox"
                  checked={preferences.interests.includes(interest.value)}
                  onChange={() => toggleInterest(interest.value)}
                />
                <span>{interest.label}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className="preference-actions">
          <button className="button button-primary" type="button" onClick={save}>
            保存偏好
          </button>
          <button className="button button-quiet" type="button" onClick={clear}>
            清除
          </button>
          {saved && <span className="save-note">已保存在此浏览器</span>}
        </div>
      </div>
    </details>
  );
}
