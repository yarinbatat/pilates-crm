import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/app/(auth)/actions";

interface NavLink {
  href: string;
  label: string;
}

export function DashboardHeader({ links, role }: { links: NavLink[], role: 'ADMIN' | 'CUSTOMER' }) {
  return (
    <header className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50 px-4 py-3" dir="rtl">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* צד ימין: לוגו וניווט */}
        <div className="flex items-center space-x-reverse space-x-8">
          <Link href={role === 'ADMIN' ? '/admin' : '/customer'} className="flex items-center gap-3">
            <Image src="/logo.jpg" alt="Logo" width={40} height={40} className="rounded-full" />
            <span className="font-semibold text-[#4a5c52] hidden md:block">ליסה פילאטיס</span>
          </Link>
          
          <nav className="hidden md:flex items-center space-x-reverse space-x-1">
            {links.map((link) => (
              <Link 
                key={link.href} 
                href={link.href}
                className="px-4 py-2 text-sm text-[#64756b] hover:bg-[#f3f5f3] rounded-full transition-colors font-medium"
              >
                {link.label}
              </Link>
            ))}
            {role === 'CUSTOMER' && (
              <Link 
                href="/customer/store"
                className="px-4 py-2 text-sm bg-[#e8f0e9] text-[#4a5c52] hover:bg-[#d8e5da] rounded-full transition-colors font-bold"
              >
                רכישת מנוי 💳
              </Link>
            )}
          </nav>
        </div>

        {/* צד שמאל: התנתקות */}
        <form action={logoutAction}>
          <Button variant="ghost" className="text-[#64756b] hover:text-red-600 hover:bg-red-50">
            התנתקות
          </Button>
        </form>
      </div>
    </header>
  );
}