import type { Locale } from '../i18n/types';

const NOVA_PROFILE_ZH_1254 = '/assets/nova_id_photo.png';
const NOVA_PROFILE_ZH_2048 = '/assets/nova_id_photo_2048.png';
const NOVA_PROFILE_EN_1254 = '/assets/nova_id_photo_en.png';
const NOVA_PROFILE_EN_2048 = '/assets/nova_id_photo_en_2048.png';

/** Nova + N7 photo is language-invariant: zh/en both resolve to this path. */
export const NOVA_N7_PHOTO = '/assets/nova_n7_photo.png';

const NOVA_PROFILE_PATHS = new Set([
  NOVA_PROFILE_ZH_1254,
  NOVA_PROFILE_ZH_2048,
  NOVA_PROFILE_EN_1254,
  NOVA_PROFILE_EN_2048,
]);

const LOCALE_INVARIANT_MEDIA_PATHS = new Set([
  NOVA_N7_PHOTO,
]);

export type ResponsiveImageAttributes = {
  src: string;
  srcSet?: string;
};

export function isNovaProfileImage(image: string | undefined): boolean {
  return Boolean(image && NOVA_PROFILE_PATHS.has(image));
}

export function localizeMediaPath(image: string | undefined, locale: Locale): string | undefined {
  if (!image) return image;
  if (LOCALE_INVARIANT_MEDIA_PATHS.has(image) || image.endsWith('/nova_n7_photo.png')) {
    return NOVA_N7_PHOTO;
  }
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
