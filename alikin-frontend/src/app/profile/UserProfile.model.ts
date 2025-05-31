export interface UserProfile {
  id: number;
  name?: string | null;
  lastName?: string | null;
  nickname?: string; // Asumo que este es el editable, y el que se muestra como principal
  profilePictureUrl?: string | null; // Esto probablemente debería ser profilePictureUrl para mostrar, y manejar File por separado
  removeProfilePicture?: boolean;
  phoneNumber?: string | null;
  birthDate?: string | Date | null;
  bio?: string | null;
  createdAt?: Date | string | null;
}
export interface UserProfileUpdate {
  name?: string | null;
  lastName?: string | null;
  nickname?: string;
  profilePictureFile?: File | null;
  removeProfilePicture?: boolean;
  phoneNumber?: string | null;
  birthDate?: string | Date | null;
  bio?: string | null;
}
