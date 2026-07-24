import type { Locale } from '../i18n/types';

const NOVA_PROFILE_ZH_1254 = '/assets/nova_id_photo.png';
const NOVA_PROFILE_ZH_2048 = '/assets/nova_id_photo_2048.png';
const NOVA_PROFILE_EN_1254 = '/assets/nova_id_photo_en.png';
const NOVA_PROFILE_EN_2048 = '/assets/nova_id_photo_en_2048.png';

const NOVA_PROFILE_PATHS = new Set([
  NOVA_PROFILE_ZH_1254,
  NOVA_PROFILE_ZH_2048,
  NOVA_PROFILE_EN_1254,
  NOVA_PROFILE_EN_2048,
]);

export type ResponsiveImageAttributes = {
  src: string;
  srcSet?: string;
};

export function isNovaProfileImage(image: string | undefined): boolean {
  return Boolean(image && NOVA_PROFILE_PATHS.has(image));
}

export function localizeMediaPath(image: string | undefined, locale: Locale): string | undefined {
  if (!isNovaProfileImage(image)) return image;
  return locale === 'en-US' ? NOVA_PROFILE_EN_1254 : NOVA_PROFILE_ZH_1254;
}

export function getResponsiveImageAttributes(image: string): ResponsiveImageAttributes {
  if (image === NOVA_PROFILE_EN_1254 || image === NOVA_PROFILE_EN_2048) {
    return {
      src: NOVA_PROFILE_EN_1254,
      srcSet: `${NOVA_PROFILE_EN_1254} 1254w, ${NOVA_PROFILE_EN_2048} 2048w`,
    };
  }

  if (image === NOVA_PROFILE_ZH_1254 || image === NOVA_PROFILE_ZH_2048) {
    return {
      src: NOVA_PROFILE_ZH_1254,
      srcSet: `${NOVA_PROFILE_ZH_1254} 1254w, ${NOVA_PROFILE_ZH_2048} 2048w`,
    };
  }

  return { src: image };
}
