
export interface UserBasicResponse {
  id: number;
  name: string;
  nickname: string;
  profilePictureUrl: string | null; // Puede ser null si no hay imagen
}


export interface CommunityRadio {
  name: string;
  streamUrl: string;
  logoUrl: string | null;
}


export interface CommunityResponse {
  id: number;
  name: string;
  description: string | null; // La descripción puede ser opcional o vacía
  imageUrl: string | null;    // La URL de la imagen puede ser null
  createdAt: string;          // La fecha como string (puedes transformarla a Date si es necesario)
  leader: UserBasicResponse;
  membersCount: number;
  userRole: 'LEADER' | 'MEMBER' | 'VISITOR' | null; // Rol del usuario actual en la comunidad

  // Este es el objeto que construimos en el frontend para la radio.
  radioPlaylist: CommunityRadio | null;

  // Las siguientes son propiedades que esperamos de la respuesta del servidor.
  // Se usan para construir `radioPlaylist` y pueden ser útiles si se acceden directamente
  // antes de la transformación o si el backend las envía siempre.
  // En el JSON de ejemplo, `radioPlaylist` del servidor era `null`.
  radioStationName?: string;  // Nombre de la estación de radio (del servidor)
  radioStreamUrl?: string;    // URL del stream de la radio (del servidor)
  radioStationLogoUrl?: string; // URL del logo de la estación de radio (del servidor)

  member?: boolean;

}
