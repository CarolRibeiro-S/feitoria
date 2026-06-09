import { 
  Cake, 
  Wheat, 
  Coffee, 
  ShoppingBasket, 
  Wine, 
  Gift, 
  Snowflake,
  type LucideIcon 
} from "lucide-react";

export const NAV_LINKS = [
  { name: "Produtos", href: "/produtos" },
  { name: "Descubra Quem Faz", href: "/produtoras" },
  { name: "Cursos & Experiências", href: "/cursos" },
  { name: "Kits", href: "/kits" },
];

export const CATEGORIES: { name: string; Icon: LucideIcon }[] = [
  { name: "Confeitaria", Icon: Cake },
  { name: "Padaria", Icon: Wheat },
  { name: "Cafés", Icon: Coffee },
  { name: "Empório", Icon: ShoppingBasket },
  { name: "Bebidas", Icon: Wine },
  { name: "Kits", Icon: Gift },
  { name: "Congelados", Icon: Snowflake },
];
