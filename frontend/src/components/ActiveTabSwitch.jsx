import { useChatStore } from "../store/useChatStore";

function ActiveTabSwitch() {
  const { activeTab, setActiveTab } = useChatStore();

  return (
    <div className="tabs tabs-boxed bg-base-300 p-2 m-2">
      <button
        onClick={() => setActiveTab("chats")}
        className={`tab transition-colors duration-200 ${
          activeTab === "chats" ? "tab-active" : ""
        }`}
      >
        Chats
      </button>

      <button
        onClick={() => setActiveTab("groups")}
        className={`tab transition-colors duration-200 ${
          activeTab === "groups" ? "tab-active" : ""
        }`}
      >
        Groups
      </button>

      <button
        onClick={() => setActiveTab("contacts")}
        className={`tab transition-colors duration-200 ${
          activeTab === "contacts" ? "tab-active" : ""
        }`}
      >
        Contacts
      </button>
    </div>
  );
}
export default ActiveTabSwitch;