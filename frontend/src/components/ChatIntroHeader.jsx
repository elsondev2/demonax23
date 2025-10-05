import React from "react";
import { generateAvatarSVG } from "../lib/avatarUtils";
import Avatar from "./Avatar";

const ChatIntroHeader = ({ user, group, firstMessageDate }) => {
  if (!user && !group) return null;

  const name = user ? user.fullName : group.name;
  const image = user
    ? (user.profilePic || "/avatar.png")
    : group.groupPic;

  const createdText = firstMessageDate
    ? `You started this chat on ${new Date(firstMessageDate).toLocaleDateString()}`
    : `Start chatting with ${name.split(" ")[0]}!`;

  return (
    <div className="w-full flex flex-col items-center text-center py-8 text-base-content/80">
      <Avatar
        src={image}
        name={name}
        alt={name}
        size="w-16 h-16"
      />
      <h2 className="text-lg font-semibold text-base-content">{name}</h2>
      {user && <div className="text-xs opacity-80">{user.email}</div>}
      <div className="text-xs mt-2">{createdText}</div>
    </div>
  );
};

export default ChatIntroHeader;
