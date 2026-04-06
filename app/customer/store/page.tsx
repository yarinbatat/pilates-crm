import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function StorePage() {
  const plans = [
    { title: "כרטיסיית 10 אימונים", price: "₪850", description: "תקפה ל-4 חודשים, מתאימה למתאמנים מזדמנים" },
    { title: "מנוי שבועי (פעמיים בשבוע)", price: "₪450", description: "חידוש חודשי אוטומטי, הבחירה הפופולרית" },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto" dir="rtl">
      <h1 className="text-3xl font-bold text-[#4a5c52] mb-8 text-right">רכישת מנוי או כרטיסייה</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {plans.map((plan) => (
          <Card key={plan.title} className="border-[#e8f0e9] shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="text-right">
              <CardTitle className="text-[#4a5c52]">{plan.title}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <span className="text-4xl font-bold text-[#64756b] mb-6">{plan.price}</span>
              <Button className="w-full bg-[#64756b] hover:bg-[#4a5c52]">בחר תוכנית זו</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}