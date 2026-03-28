import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

const baseProps = {
  fill: 'none',
  height: 31,
  viewBox: '0 0 31 31',
  width: 31
};

export function PlayIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props} aria-hidden="true">
      <path
        d="M25 15.2783V15.7467C24.9987 16.1926 24.7689 16.6052 24.3945 16.834L9.74909 25.5495C8.86546 26.0848 8.40727 26.0848 8.01455 25.8506L7.60545 25.6164C7.24086 25.3939 7.01257 24.9965 7 24.5626V6.46244C7.00132 6.01653 7.23107 5.60392 7.60545 5.37509L8.01455 5.1409C8.40727 4.9067 8.86545 4.9067 10.0109 5.59256L24.3945 14.191C24.7689 14.4198 24.9987 14.8324 25 15.2783Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function PauseIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props} aria-hidden="true">
      <rect
        x="8.3"
        y="6.1"
        width="4.4"
        height="18.8"
        rx="1.2"
        fill="currentColor"
      />
      <rect
        x="18.3"
        y="6.1"
        width="4.4"
        height="18.8"
        rx="1.2"
        fill="currentColor"
      />
    </svg>
  );
}

export function ReplayIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props} aria-hidden="true">
      <path
        d="M23.6 11.2a9.2 9.2 0 1 0 1 7.7"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.4"
      />
      <path
        d="m21.9 6.7 0.1 6.1-6.1-0.1"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.4"
      />
    </svg>
  );
}

export function VolumeIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props} aria-hidden="true">
      <path
        d="M16.7912 6.3125V24.6875C16.7912 25.4124 16.2185 26 15.5121 26H14.7574C14.4218 25.9986 14.1003 25.8619 13.862 25.6194L8.96299 20.5925C8.24403 19.8539 7.26864 19.4384 6.25125 19.4375C5.00792 19.4375 4 18.4033 4 17.1275V13.8725C4 12.5967 5.00792 11.5625 6.25125 11.5625C7.26864 11.5616 8.24403 11.1461 8.96299 10.4075L13.862 5.38062C14.1003 5.13815 14.4218 5.00145 14.7574 5H15.5121C16.2185 5 16.7912 5.58763 16.7912 6.3125ZM24.4659 8.58313C24.3429 8.45533 24.1798 8.3763 24.0054 8.36C23.8279 8.35535 23.6564 8.42666 23.5322 8.55687L22.624 9.48875C22.3965 9.74046 22.3965 10.1295 22.624 10.3813C25.0806 13.3283 25.0806 17.6717 22.624 20.6187C22.3965 20.8705 22.3965 21.2595 22.624 21.5112L23.5322 22.4431C23.6564 22.5733 23.8279 22.6447 24.0054 22.64C24.1804 22.626 24.3442 22.5466 24.4659 22.4169C27.8447 18.4573 27.8447 12.5427 24.4659 8.58313ZM20.4239 12.0875C20.2384 12.0803 20.058 12.1514 19.9251 12.2844L19.0169 13.2294C18.7988 13.4479 18.7613 13.7939 18.9273 14.0562C19.4896 14.9323 19.4896 16.0677 18.9273 16.9438C18.7613 17.2061 18.7988 17.5521 19.0169 17.7706L19.9251 18.7156C20.0593 18.8451 20.24 18.9117 20.4239 18.8994C20.6086 18.8874 20.7801 18.7971 20.8972 18.65C22.2616 16.7833 22.2616 14.2167 20.8972 12.35C20.7778 12.2038 20.6085 12.1099 20.4239 12.0875Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function VolumeMutedIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props} aria-hidden="true">
      <path
        d="M16.7912 6.3125V24.6875C16.7912 25.4124 16.2185 26 15.5121 26H14.7574C14.4218 25.9986 14.1003 25.8619 13.862 25.6194L8.96299 20.5925C8.24403 19.8539 7.26864 19.4384 6.25125 19.4375C5.00792 19.4375 4 18.4033 4 17.1275V13.8725C4 12.5967 5.00792 11.5625 6.25125 11.5625C7.26864 11.5616 8.24403 11.1461 8.96299 10.4075L13.862 5.38062C14.1003 5.13815 14.4218 5.00145 14.7574 5H15.5121C16.2185 5 16.7912 5.58763 16.7912 6.3125Z"
        fill="currentColor"
      />
      <rect
        x="18.2"
        y="10"
        width="2.7"
        height="12.2"
        rx="1.35"
        transform="rotate(-45 18.2 10)"
        fill="currentColor"
      />
      <rect
        x="19.9"
        y="18.6"
        width="2.7"
        height="12.2"
        rx="1.35"
        transform="rotate(-135 19.9 18.6)"
        fill="currentColor"
      />
    </svg>
  );
}

export function SettingsIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props} aria-hidden="true">
      <path
        d="M24.6247 17.7354L23.8136 17.0741C23.3218 16.6707 23.0513 16.0617 23.0836 15.4309C23.0836 15.2906 23.0836 15.1403 23.0836 15C23.0836 14.8597 23.0836 14.7094 23.0836 14.5691C23.0513 13.9383 23.3218 13.3293 23.8136 12.9259L24.6247 12.2646C25.0095 11.9561 25.1124 11.418 24.868 10.992L23.6919 8.98803C23.4427 8.56962 22.9257 8.38806 22.4652 8.55717L21.4513 8.91789C20.853 9.13888 20.1843 9.06834 19.6467 8.72751C19.4083 8.56478 19.1575 8.42072 18.8964 8.29665C18.3259 8.0075 17.9274 7.46873 17.8217 6.84376L17.6494 5.84176C17.569 5.35173 17.1378 4.9937 16.6355 5.00008H14.3037C13.8014 4.9937 13.3701 5.35173 13.2898 5.84176L13.1174 6.84376C13.0206 7.46084 12.6382 7.99804 12.0833 8.29665C11.8222 8.42072 11.5714 8.56478 11.3331 8.72751C10.7954 9.06834 10.1267 9.13888 9.52841 8.91789L8.51455 8.55717C8.05989 8.39911 7.55549 8.57925 7.30807 8.98803L6.132 10.992C5.88759 11.418 5.99049 11.9561 6.37532 12.2646L7.18641 12.9259C7.67818 13.3293 7.9487 13.9383 7.91638 14.5691C7.91638 14.7094 7.91638 14.8597 7.91638 15C7.91638 15.1403 7.91638 15.2906 7.91638 15.4309C7.9487 16.0617 7.67818 16.6707 7.18641 17.0741L6.37532 17.7354C5.99049 18.0439 5.88759 18.582 6.132 19.008L7.30807 21.012C7.55735 21.4304 8.0743 21.6119 8.53483 21.4428L9.54868 21.0821C10.147 20.8611 10.8157 20.9317 11.3533 21.2725C11.5917 21.4352 11.8425 21.5793 12.1036 21.7034C12.6741 21.9925 13.0726 22.5313 13.1783 23.1562L13.3506 24.1582C13.431 24.6483 13.8622 25.0063 14.3645 24.9999H16.6963C17.1986 25.0063 17.6299 24.6483 17.7102 24.1582L17.8826 23.1562C17.9882 22.5313 18.3867 21.9925 18.9572 21.7034C19.2183 21.5793 19.4692 21.4352 19.7075 21.2725C20.2451 20.9317 20.9138 20.8611 21.5121 21.0821L22.526 21.4428C22.9686 21.5797 23.4487 21.4022 23.6919 21.012L24.868 19.008C25.1124 18.582 25.0095 18.0439 24.6247 17.7354ZM15.5 18.006C13.8202 18.006 12.4584 16.6602 12.4584 15C12.4584 13.3398 13.8202 11.994 15.5 11.994C17.1798 11.994 18.5416 13.3398 18.5416 15C18.5416 15.7972 18.2211 16.5618 17.6507 17.1256C17.0803 17.6893 16.3067 18.006 15.5 18.006Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function FullscreenIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props} aria-hidden="true">
      <rect
        width="3.17647"
        height="6.35294"
        transform="translate(6 6.5)"
        fill="currentColor"
      />
      <rect
        width="3.17647"
        height="6.35294"
        transform="translate(6 9.67676) rotate(-90)"
        fill="currentColor"
      />
      <rect
        width="3.17647"
        height="6.35294"
        transform="matrix(1 0 0 -1 6 24.5)"
        fill="currentColor"
      />
      <rect
        width="3.17647"
        height="6.35294"
        transform="matrix(-4.37114e-08 1 1 4.37114e-08 6 21.3232)"
        fill="currentColor"
      />
      <rect
        width="3.17647"
        height="6.35294"
        transform="translate(24 6.5) rotate(90)"
        fill="currentColor"
      />
      <rect
        width="3.17647"
        height="6.35294"
        transform="translate(20.8242 6.5)"
        fill="currentColor"
      />
      <rect
        width="3.17647"
        height="6.35294"
        transform="matrix(-4.37114e-08 -1 -1 4.37114e-08 24 24.5)"
        fill="currentColor"
      />
      <rect
        width="3.17647"
        height="6.35294"
        transform="matrix(1 0 0 -1 20.8242 24.5)"
        fill="currentColor"
      />
    </svg>
  );
}

export function ExitFullscreenIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props} aria-hidden="true">
      <g fill="currentColor">
        <rect x="10" y="10" width="5" height="3" />
        <rect x="10" y="10" width="3" height="5" />
        <rect x="16" y="10" width="5" height="3" />
        <rect x="18" y="10" width="3" height="5" />
        <rect x="10" y="16" width="3" height="5" />
        <rect x="10" y="18" width="5" height="3" />
        <rect x="16" y="18" width="5" height="3" />
        <rect x="18" y="16" width="3" height="5" />
      </g>
    </svg>
  );
}

export function PictureInPictureIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props} aria-hidden="true">
      <rect
        x="5"
        y="7"
        width="21"
        height="17"
        rx="2.4"
        stroke="currentColor"
        strokeWidth="2.4"
      />
      <rect
        x="14.8"
        y="13"
        width="8.2"
        height="6.1"
        rx="1"
        fill="currentColor"
      />
    </svg>
  );
}

export function ChevronLeftIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props} aria-hidden="true">
      <path
        d="M18.8 8.6 12.2 15l6.6 6.4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.3"
      />
    </svg>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props} aria-hidden="true">
      <path
        d="m12.2 8.6 6.6 6.4-6.6 6.4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.3"
      />
    </svg>
  );
}
