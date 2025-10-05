import React from "react";

const UnreadSeparator = ({ count }) => {
  return (
    <div className="divider my-2">
      <div className="text-xs text-base-content/50 font-normal tracking-wide">
        {typeof count === 'number' && count > 0 ? `${count} new message${count > 1 ? 's' : ''}` : "New messages"}
      </div>
    </div>
  );
};

export default UnreadSeparator;
