import { comfortaa } from "@/app/type-faces";
import Link from "next/link";
import ROUTES from "@/lib/constants/routes";
import { MenuIcon, CompanyLogo } from "@/components/ui/icons/custom-icons";

export function Logo({ isMobile }: { isMobile: boolean }) {
  return (
    <div className="flex items-center -my-2 py-2 -mx-4 px-4 rounded-lg hover:bg-primaryHover-light dark:hover:bg-primaryHover-dark transition-colors duration-200">
      {isMobile ? (
        <div className="flex items-center">
          <div className="mr-3 text-primary-light dark:text-primary-dark">
            <MenuIcon
              width={20}
              height={20}
              className="fill-primary-light dark:fill-primary-dark"
            />
          </div>
          <h1
            className={`${comfortaa.className} text-2xl font-bold text-primary-light dark:text-primary-dark translate-y-[2px]`}
          >
            <span className="sr-only">Zesty</span>
            <span className="">
              <CompanyLogo width={68} height={28} />
            </span>
          </h1>
        </div>
      ) : (
        <Link href={ROUTES.HOME} className="flex items-center">
          <h1
            className={`${comfortaa.className} text-2xl font-bold text-primary-light dark:text-primary-dark translate-y-[2px]`}
          >
            <span className="sr-only">Zesty</span>
            <span className="translate-y-2">
              <CompanyLogo width={68} height={28} />
            </span>
          </h1>
        </Link>
      )}
    </div>
  );
}
