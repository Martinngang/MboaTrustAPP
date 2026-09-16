// Ported 1:1 from MboaTrustFrontend/src/inventoryTaxonomy.ts — default
// construction-materials taxonomy shown as suggestions throughout the
// inventory UI, never enforced server-side (InventoryItem.category/
// subcategory are free strings) — a supplier can always type something new.
export interface CategoryTaxonomyEntry {
  category: string;
  subcategories: string[];
}

export const CATEGORY_TAXONOMY: CategoryTaxonomyEntry[] = [
  { category: 'Cement & Concrete', subcategories: ['Cement', 'Concrete blocks', 'Aggregates (sand/gravel)', 'Reinforcement steel', 'Admixtures'] },
  { category: 'Roofing', subcategories: ['Roofing sheets', 'Ridge caps', 'Roofing nails & screws', 'Insulation', 'Gutters & downpipes'] },
  { category: 'Plumbing', subcategories: ['Pipes & fittings', 'Taps & valves', 'Sanitary ware', 'Water tanks', 'Pumps'] },
  { category: 'Electrical', subcategories: ['Cables & wires', 'Switches & sockets', 'Circuit breakers & panels', 'Lighting', 'Conduits & trunking'] },
  { category: 'Timber & Carpentry', subcategories: ['Timber & lumber', 'Plywood & MDF', 'Doors & frames', 'Windows', 'Hinges & handles'] },
  { category: 'Masonry & Structural', subcategories: ['Bricks & blocks', 'Steel structures', 'Scaffolding', 'Formwork'] },
  { category: 'Paint & Finishing', subcategories: ['Paints & primers', 'Tiles', 'Adhesives & grout', 'Varnish & sealants'] },
  { category: 'Tools & Equipment', subcategories: ['Hand tools', 'Power tools', 'Safety equipment (PPE)', 'Measuring tools'] },
  { category: 'Hardware & Fasteners', subcategories: ['Nails, screws & bolts', 'Locks & security', 'Fencing', 'Wire mesh'] },
  { category: 'Sanitation & Water', subcategories: ['Septic tanks', 'Water treatment', 'Drainage'] },
];

export const CATEGORY_NAMES = CATEGORY_TAXONOMY.map((c) => c.category);

export function subcategoriesFor(category: string): string[] {
  return CATEGORY_TAXONOMY.find((c) => c.category === category)?.subcategories ?? [];
}

export const PROJECT_CATEGORIES = ['Water & Sanitation', 'Education', 'Healthcare', 'Infrastructure', 'Agriculture', 'Housing'];

export const UNIT_SUGGESTIONS = ['bag', 'sheet', 'meter', 'unit', 'roll', 'litre', 'kg', 'box', 'pack', 'length', 'truckload', 'pair'];
