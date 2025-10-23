"use client";

import { useState } from "react";
import { ProfileSidebar } from "./ProfileSidebar";
import { ProfileEditModal } from "./ProfileEditModal";

interface ProfileSidebarClientProps {
  profile: any;
  ambassadorProfile: any;
  clientProfile: any;
}

export function ProfileSidebarClient({
  profile,
  ambassadorProfile,
  clientProfile,
}: ProfileSidebarClientProps) {
  const [showEditModal, setShowEditModal] = useState(false);

  return (
    <>
      <ProfileSidebar
        profile={profile}
        ambassadorProfile={ambassadorProfile}
        clientProfile={clientProfile}
        onEditProfile={() => setShowEditModal(true)}
      />

      {showEditModal && (
        <ProfileEditModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSave={() => {
            setShowEditModal(false);
            // Refresh the page to show updated data
            window.location.reload();
          }}
        />
      )}
    </>
  );
}
