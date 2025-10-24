interface MessageStatusProps {
  status?: "sending" | "sent" | "delivered" | "read" | "error";
  isGroupChat: boolean;
  readBy?: Record<string, string>; // userId -> timestamp
}

export function MessageStatus({
  status = "sent",
  isGroupChat,
  readBy,
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
    return <div className="text-gray-500 text-xs">Delivered</div>;
  }

  if (status === "delivered") {
    return <div className="text-gray-600 text-xs">Delivered</div>;
  }

  if (status === "read") {
    if (isGroupChat && readBy) {
      const readCount = Object.keys(readBy).length;
      return (
        <div className="text-blue-600 text-xs" title={`Read by ${readCount}`}>
          Read
        </div>
      );
    }
    return <div className="text-blue-600 text-xs">Read</div>;
  }

  if (status === "error") {
    return (
      <div className="text-red-500 text-xs" title="Failed to send">Failed</div>
    );
  }

  return null;
}
