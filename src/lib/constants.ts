import {
  Cake,
  Coffee,
  ShoppingBasket,
  Gift,
  Snowflake,
  type LucideIcon
} from "lucide-react";

export const NAV_LINKS = [
  { name: "Produtos", href: "/produtos" },
  { name: "Descubra Quem Faz", href: "/produtoras" },
  { name: "Experiências", href: "/experiencias" },
  { name: "Cursos", href: "/cursos" },
  { name: "Kits", href: "/kits" },
];

export const CATEGORIES: { name: string; Icon: LucideIcon }[] = [
  { name: "Pães & Confeitaria", Icon: Cake },
  { name: "Bebidas & Cafés",    Icon: Coffee },
  { name: "Empório",            Icon: ShoppingBasket },
  { name: "Congelados",         Icon: Snowflake },
  { name: "Kits",               Icon: Gift },
];
