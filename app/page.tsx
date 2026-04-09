import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#fcfaf8] flex flex-col items-center justify-center p-6 text-right" dir="rtl">
      <div className="max-w-md w-full space-y-8 text-center">
        {/* לוגו ושם הסטודיו */}
        <div className="flex flex-col items-center space-y-4">
          <div className="relative w-40 h-40">
            <Image 
              src="/logo.jpg" 
              alt="ליסה פילאטיס לוגו" 
              fill 
              className="object-contain"
            />
          </div>
          <h1 className="text-4xl font-light text-[#4a5c52]">ליסה פילאטיס</h1>
          <p className="text-[#8a9a8e] text-lg">בוטיק פילאטיס מכשירים ומזרן</p>
        </div>

        {/* כפתורי כניסה */}
        <div className="flex flex-col gap-4 mt-12 w-full">
          <Link href="/login" className="w-full">
            <Button className="w-full bg-[#64756b] hover:bg-[#4a5c52] text-white py-6 text-lg rounded-xl">
              התחברות למערכת
            </Button>
          </Link>
          <Link href="/register" className="w-full">
            <Button variant="outline" className="w-full border-[#64756b] text-[#64756b] py-6 text-lg rounded-xl hover:bg-[#f3f5f3]">
              הרשמה למתאמנים חדשים
            </Button>
          </Link>
        </div>
      </div>

      <footer className="mt-20 text-[#b0bcaf] text-sm">
        © {new Date().getFullYear()} Lisa Pilates. כל הזכויות שמורות.
      </footer>
    </div>
  );
}