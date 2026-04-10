export const editorialImages = {
  codingDesk: "/editorial/coding-desk.jpg",
  clientMeeting: "/editorial/client-meeting.jpg",
  studioTeam: "/editorial/studio-team.jpg",
  executionWorkspace: "/editorial/execution-workspace.jpg",
  conversionCollab: "/editorial/conversion-collab.jpg",
  fastDeliveryCode: "/editorial/fast-delivery-code.jpg",
  serviceBuild: "/editorial/execution-workspace.jpg",
  serviceRevamp: "/editorial/coding-desk.jpg",
  serviceBackend: "/editorial/fast-delivery-code.jpg",
  contactImage: "/editorial/contact/contact-hero.jpg"
} as const;

export const projectFallbackImages = [
  editorialImages.codingDesk,
  editorialImages.clientMeeting,
  editorialImages.studioTeam,
  editorialImages.contactImage
] as const;

export const getProjectFallbackImage = (seed: string | number) => {
  const value = String(seed);
  const total = value.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return projectFallbackImages[total % projectFallbackImages.length];
};
