interface MessageStatusProps {
  status?: "sending" | "sent" | "delivered" | "read" | "error";
  isGroupChat: boolean;
  readBy?: Record<string, string>; // userId -> timestamp
  userId?: string;
}

export function MessageStatus({
  status = "sent",
  isGroupChat,
  readBy,
  userId,
}: MessageStatusProps) {
  if (status === "sending") {
    return (
      <div
        className="w-3 h-3 border border-gray-300 border-t-blue-500 rounded-full animate-spin"
        title="Sending..."
      />
    );
  }

  if (status === "sent") {
    return <div className="text-gray-400 text-xs">✓</div>;
  }

  if (status === "delivered") {
    return <div className="text-gray-600 text-xs">✓✓</div>;
  }

  if (status === "read") {
    if (isGroupChat && readBy) {
      const readCount = Object.keys(readBy).length;
      return (
        <div className="text-blue-500 text-xs" title={`Read by ${readCount}`}>
          ✓✓
        </div>
      );
    }
    return <div className="text-blue-500 text-xs">✓✓</div>;
  }

  if (status === "error") {
    return (
      <div className="text-red-500 font-bold text-xs" title="Failed to send">
        !
      </div>
    );
  }

  return null;
}
