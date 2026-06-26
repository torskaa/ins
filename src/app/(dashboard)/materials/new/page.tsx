"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useFormValidation } from "@/hooks/use-form-validation"
import { productSchema, z } from "@/lib/validation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
} from "@/components/ui/combobox"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { ImageGallery } from "@/components/ui/image-gallery"
import { EmptyState } from "@/components/ui/empty-state"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { AlertCircle, AlertTriangle, Plus, X, Boxes, DollarSign, FlaskConical, Layers, MapPin, Package, Tags } from "lucide-react"

const MATERIAL_TYPES = [
  { value: "fabric", label: "Fabric / Textile" },
  { value: "chemical", label: "Chemical" },
  { value: "metal", label: "Metal / Alloy" },
  { value: "plastic", label: "Plastic / Polymer" },
  { value: "wood", label: "Wood / Timber" },
  { value: "electronic", label: "Electronic Component" },
  { value: "packaging", label: "Packaging Material" },
  { value: "rubber", label: "Rubber / Elastomer" },
  { value: "ceramic", label: "Ceramic / Glass" },
  { value: "composite", label: "Composite Material" },
  { value: "raw", label: "Raw Material / Commodity" },
  { value: "adhesive", label: "Adhesive / Sealant" },
  { value: "coating", label: "Coating / Paint" },
  { value: "hardware", label: "Hardware / Fastener" },
  { value: "leather", label: "Leather" },
  { value: "foam", label: "Foam / Insulation" },
  { value: "paper", label: "Paper / Pulp" },
  { value: "food", label: "Food Grade Material" },
  { value: "pharma", label: "Pharmaceutical / Medical" },
  { value: "other", label: "Other" },
]

type SpecField = { key: string; label: string; type: "text" | "number" | "select"; options?: { value: string; label: string }[]; placeholder?: string }

const MATERIAL_SPECS: Record<string, SpecField[]> = {
  fabric: [
    { key: "gsm", label: "GSM (g/m²)", type: "number", placeholder: "e.g. 180" },
    { key: "fabricWidth", label: "Fabric Width (cm)", type: "number", placeholder: "e.g. 150" },
    { key: "weaveType", label: "Weave Type", type: "select", options: [{ value: "plain", label: "Plain" }, { value: "twill", label: "Twill" }, { value: "satin", label: "Satin" }, { value: "jersey", label: "Jersey" }, { value: "other", label: "Other" }] },
  ],
  chemical: [
    { key: "purity", label: "Purity (%)", type: "number", placeholder: "e.g. 99.5" },
    { key: "safetyClass", label: "Safety Class", type: "select", options: [{ value: "class_1", label: "Class 1 — Non-hazardous" }, { value: "class_2", label: "Class 2 — Irritant" }, { value: "class_3", label: "Class 3 — Corrosive" }, { value: "class_4", label: "Class 4 — Toxic" }, { value: "class_5", label: "Class 5 — Explosive" }] },
    { key: "flashPoint", label: "Flash Point (°C)", type: "number", placeholder: "e.g. 45" },
    { key: "ph", label: "pH Level", type: "number", placeholder: "e.g. 7.0" },
    { key: "density", label: "Density (g/cm³)", type: "number", placeholder: "e.g. 1.2" },
  ],
  metal: [
    { key: "grade", label: "Grade", type: "text", placeholder: "e.g. 304, A36, 6061" },
    { key: "tensileStrength", label: "Tensile Strength (MPa)", type: "number", placeholder: "e.g. 505" },
    { key: "hardness", label: "Hardness (HRC/HB)", type: "text", placeholder: "e.g. HRC 40" },
    { key: "dimensions", label: "Dimensions", type: "text", placeholder: "e.g. 2mm x 1m x 2m" },
    { key: "surfaceTreatment", label: "Surface Treatment", type: "select", options: [{ value: "none", label: "None" }, { value: "galvanized", label: "Galvanized" }, { value: "anodized", label: "Anodized" }, { value: "painted", label: "Painted" }, { value: "polished", label: "Polished" }, { value: "other", label: "Other" }] },
  ],
  plastic: [
    { key: "density", label: "Density (g/cm³)", type: "number", placeholder: "e.g. 0.95" },
    { key: "meltFlowIndex", label: "Melt Flow Index (g/10min)", type: "number", placeholder: "e.g. 8.0" },
    { key: "heatDeflection", label: "Heat Deflection Temp (°C)", type: "number", placeholder: "e.g. 85" },
    { key: "flexuralModulus", label: "Flexural Modulus (MPa)", type: "number", placeholder: "e.g. 2000" },
    { key: "uvResistant", label: "UV Resistant", type: "select", options: [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }] },
  ],
  wood: [
    { key: "species", label: "Species", type: "text", placeholder: "e.g. Oak, Teak, Pine" },
    { key: "moistureContent", label: "Moisture Content (%)", type: "number", placeholder: "e.g. 12" },
    { key: "hardness", label: "Hardness Rating", type: "select", options: [{ value: "soft", label: "Softwood" }, { value: "medium", label: "Medium" }, { value: "hard", label: "Hardwood" }] },
    { key: "grade", label: "Grade", type: "text", placeholder: "e.g. A, B, FAS" },
    { key: "treatment", label: "Treatment", type: "text", placeholder: "e.g. Kiln-dried, Pressure-treated" },
  ],
  electronic: [
    { key: "componentType", label: "Component Type", type: "text", placeholder: "e.g. Resistor, IC, Capacitor" },
    { key: "voltageRating", label: "Voltage Rating (V)", type: "number", placeholder: "e.g. 12" },
    { key: "powerRating", label: "Power Rating (W)", type: "number", placeholder: "e.g. 0.25" },
    { key: "packageType", label: "Package Type", type: "text", placeholder: "e.g. SMD, DIP, QFP" },
    { key: "tolerance", label: "Tolerance (%)", type: "number", placeholder: "e.g. 5" },
  ],
  packaging: [
    { key: "materialLayer", label: "Material Layer", type: "text", placeholder: "e.g. 3-ply, Aluminum foil" },
    { key: "thickness", label: "Thickness (microns)", type: "number", placeholder: "e.g. 50" },
    { key: "printSpec", label: "Print Specification", type: "text", placeholder: "e.g. Flexo 1-color" },
    { key: "finish", label: "Finish", type: "select", options: [{ value: "matte", label: "Matte" }, { value: "glossy", label: "Glossy" }, { value: "metallic", label: "Metallic" }] },
  ],
  rubber: [
    { key: "hardness", label: "Hardness (Shore A)", type: "number", placeholder: "e.g. 70" },
    { key: "elongation", label: "Elongation at Break (%)", type: "number", placeholder: "e.g. 300" },
    { key: "tearStrength", label: "Tear Strength (N/mm)", type: "number", placeholder: "e.g. 25" },
    { key: "type", label: "Rubber Type", type: "select", options: [{ value: "natural", label: "Natural Rubber" }, { value: "silicone", label: "Silicone" }, { value: "neoprene", label: "Neoprene" }, { value: "epdm", label: "EPDM" }, { value: "nitrile", label: "Nitrile" }, { value: "viton", label: "Viton" }] },
  ],
  ceramic: [
    { key: "type", label: "Type", type: "select", options: [{ value: "porcelain", label: "Porcelain" }, { value: "stoneware", label: "Stoneware" }, { value: "alumina", label: "Alumina" }, { value: "zirconia", label: "Zirconia" }, { value: "glass", label: "Glass" }, { value: "borosilicate", label: "Borosilicate Glass" }] },
    { key: "thickness", label: "Thickness (mm)", type: "number", placeholder: "e.g. 5" },
    { key: "thermalResistance", label: "Thermal Resistance", type: "text", placeholder: "e.g. Up to 1200°C" },
  ],
  composite: [
    { key: "resinType", label: "Resin Type", type: "text", placeholder: "e.g. Epoxy, Polyester" },
    { key: "fiberType", label: "Fiber Type", type: "select", options: [{ value: "carbon", label: "Carbon Fiber" }, { value: "fiberglass", label: "Fiberglass" }, { value: "kevlar", label: "Kevlar" }, { value: "natural", label: "Natural Fiber" }] },
    { key: "layerCount", label: "Layer Count", type: "number", placeholder: "e.g. 5" },
    { key: "orientation", label: "Fiber Orientation", type: "text", placeholder: "e.g. 0/90/45°" },
  ],
  raw: [
    { key: "purity", label: "Purity / Quality", type: "text", placeholder: "e.g. 99.9%, Food Grade" },
    { key: "form", label: "Form", type: "select", options: [{ value: "powder", label: "Powder" }, { value: "granule", label: "Granule" }, { value: "liquid", label: "Liquid" }, { value: "solid", label: "Solid Block" }, { value: "pellet", label: "Pellet" }, { value: "flake", label: "Flake" }] },
    { key: "origin", label: "Origin", type: "text", placeholder: "e.g. Thailand, Imported" },
    { key: "meshSize", label: "Mesh Size", type: "text", placeholder: "e.g. 200 mesh" },
  ],
  adhesive: [
    { key: "baseType", label: "Base Type", type: "select", options: [{ value: "epoxy", label: "Epoxy" }, { value: "silicone", label: "Silicone" }, { value: "polyurethane", label: "Polyurethane" }, { value: "cyanoacrylate", label: "Cyanoacrylate" }, { value: "acrylic", label: "Acrylic" }, { value: "hotmelt", label: "Hot Melt" }] },
    { key: "viscosity", label: "Viscosity (mPa·s)", type: "number", placeholder: "e.g. 500" },
    { key: "curingTime", label: "Curing Time", type: "text", placeholder: "e.g. 24h at 25°C" },
    { key: "tempRange", label: "Temperature Range (°C)", type: "text", placeholder: "e.g. -40 to 120" },
  ],
  coating: [
    { key: "type", label: "Type", type: "select", options: [{ value: "acrylic", label: "Acrylic" }, { value: "epoxy", label: "Epoxy" }, { value: "polyurethane", label: "Polyurethane" }, { value: "powder", label: "Powder Coating" }, { value: "enamel", label: "Enamel" }, { value: "primer", label: "Primer" }] },
    { key: "finish", label: "Finish", type: "select", options: [{ value: "matte", label: "Matte" }, { value: "satin", label: "Satin" }, { value: "glossy", label: "Glossy" }, { value: "textured", label: "Textured" }] },
    { key: "coverage", label: "Coverage Rate (m²/L)", type: "number", placeholder: "e.g. 10" },
    { key: "vocContent", label: "VOC Content (g/L)", type: "number", placeholder: "e.g. 50" },
  ],
  hardware: [
    { key: "type", label: "Type", type: "text", placeholder: "e.g. Bolt, Screw, Washer, Nut" },
    { key: "materialGrade", label: "Material Grade", type: "text", placeholder: "e.g. Stainless 304, Grade 8" },
    { key: "size", label: "Size / Thread", type: "text", placeholder: "e.g. M8 x 30mm" },
    { key: "headType", label: "Head Type", type: "select", options: [{ value: "hex", label: "Hex" }, { value: "phillips", label: "Phillips" }, { value: "flat", label: "Flat" }, { value: "socket", label: "Socket" }, { value: "torx", label: "Torx" }] },
    { key: "coating", label: "Coating", type: "select", options: [{ value: "none", label: "None" }, { value: "zinc", label: "Zinc Plated" }, { value: "stainless", label: "Stainless" }, { value: "black_oxide", label: "Black Oxide" }, { value: "galvanized", label: "Galvanized" }] },
  ],
  leather: [
    { key: "type", label: "Leather Type", type: "select", options: [{ value: "full_grain", label: "Full Grain" }, { value: "top_grain", label: "Top Grain" }, { value: "genuine", label: "Genuine Leather" }, { value: "bonded", label: "Bonded" }, { value: "synthetic", label: "Synthetic / PU" }] },
    { key: "thickness", label: "Thickness (mm)", type: "number", placeholder: "e.g. 1.5" },
    { key: "finish", label: "Finish", type: "text", placeholder: "e.g. Aniline, Semi-aniline, Pigmented" },
  ],
  foam: [
    { key: "type", label: "Foam Type", type: "select", options: [{ value: "pu", label: "Polyurethane" }, { value: "pe", label: "Polyethylene" }, { value: "eva", label: "EVA" }, { value: "memory", label: "Memory Foam" }, { value: "rubber", label: "Foam Rubber" }, { value: "xps", label: "XPS / Styrofoam" }] },
    { key: "density", label: "Density (kg/m³)", type: "number", placeholder: "e.g. 25" },
    { key: "thickness", label: "Thickness (mm)", type: "number", placeholder: "e.g. 50" },
    { key: "compressionStrength", label: "Compression Strength (kPa)", type: "number", placeholder: "e.g. 100" },
  ],
  paper: [
    { key: "gsm", label: "GSM (g/m²)", type: "number", placeholder: "e.g. 80" },
    { key: "grade", label: "Grade", type: "text", placeholder: "e.g. Bond, Kraft, Cardboard" },
    { key: "finish", label: "Finish", type: "select", options: [{ value: "uncoated", label: "Uncoated" }, { value: "coated", label: "Coated" }, { value: "gloss", label: "Gloss" }, { value: "matte", label: "Matte" }] },
    { key: "brightness", label: "Brightness (%)", type: "number", placeholder: "e.g. 90" },
  ],
  food: [
    { key: "grade", label: "Grade", type: "select", options: [{ value: "organic", label: "Organic" }, { value: "conventional", label: "Conventional" }, { value: "gmo", label: "GMO" }, { value: "non_gmo", label: "Non-GMO" }] },
    { key: "shelfLife", label: "Shelf Life (days)", type: "number", placeholder: "e.g. 180" },
    { key: "storageTemp", label: "Storage Temperature (°C)", type: "text", placeholder: "e.g. 2-8°C" },
    { key: "allergenInfo", label: "Allergen Info", type: "text", placeholder: "e.g. Contains soy, gluten-free" },
  ],
  pharma: [
    { key: "uspGrade", label: "USP / EP Grade", type: "text", placeholder: "e.g. USP-NF, EP" },
    { key: "casNumber", label: "CAS Number", type: "text", placeholder: "e.g. 7732-18-5" },
    { key: "storageCondition", label: "Storage Condition", type: "select", options: [{ value: "room_temp", label: "Room Temperature" }, { value: "refrigerated", label: "Refrigerated (2-8°C)" }, { value: "frozen", label: "Frozen (-20°C)" }, { value: "controlled", label: "Controlled Room Temp" }] },
    { key: "sterility", label: "Sterility", type: "select", options: [{ value: "sterile", label: "Sterile" }, { value: "non_sterile", label: "Non-sterile" }] },
    { key: "lotNumber", label: "Lot / Batch Number", type: "text", placeholder: "e.g. LOT-2024-001" },
  ],
}

const CURRENCIES = [
  { value: "THB", label: "THB (฿)" },
  { value: "USD", label: "USD ($)" },
  { value: "EUR", label: "EUR (€)" },
  { value: "GBP", label: "GBP (£)" },
  { value: "JPY", label: "JPY (¥)" },
  { value: "CNY", label: "CNY (¥)" },
  { value: "SGD", label: "SGD (S$)" },
  { value: "MYR", label: "MYR (RM)" },
  { value: "VND", label: "VND (₫)" },
  { value: "KRW", label: "KRW (₩)" },
]

const VAT_OPTIONS = [
  { value: "include_vat", label: "รวม VAT (Include VAT)" },
  { value: "exclude_vat", label: "ไม่รวม VAT (Exclude VAT)" },
  { value: "import_duty", label: "ภาษีขาเข้า (Import Duty)" },
  { value: "zero_rated", label: "Zero Rated" },
  { value: "exempt", label: "ยกเว้นภาษี (Exempt)" },
]

const UOM_OPTIONS = [
  { value: "pcs", label: "Pieces (pcs)" },
  { value: "kg", label: "Kilograms (kg)" },
  { value: "g", label: "Grams (g)" },
  { value: "box", label: "Box" },
  { value: "pack", label: "Pack" },
  { value: "liter", label: "Liter (L)" },
  { value: "ml", label: "Milliliter (ml)" },
  { value: "m", label: "Meters (m)" },
  { value: "roll", label: "Roll" },
  { value: "sheet", label: "Sheet" },
  { value: "set", label: "Set" },
  { value: "unit", label: "Unit" },
]

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "discontinued", label: "Discontinued" },
]

const PRESET_TAGS = [
  "Best Seller", "Seasonal", "Fragile", "Hazardous",
  "Perishable", "Imported", "Premium", "Eco-Friendly", "Bulk", "Sample",
]

type SupplierPriceRow = {
  tempId: string
  supplierId: string
  price: string
  currency: string
  leadTime: string
  isDefault: boolean
  notes: string
}

type SpecRow = {
  id: string
  key: string
  value: string
}

const Field = ({ id, label, required, children, className }: { id?: string; label: React.ReactNode; required?: boolean; children: React.ReactNode; className?: string }) => (
  <div className={cn("space-y-2", className)}>
    <Label htmlFor={id} className="text-xs font-medium">{label}{required && <span className="text-destructive ml-0.5">*</span>}</Label>
    {children}
  </div>
)

export default function NewMaterialPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([])
  const [warehouses, setWarehouses] = useState<{ id: string; name: string }[]>([])
  const [skuError, setSkuError] = useState("")
  const [skuChecking, setSkuChecking] = useState(false)
  const [skuValid, setSkuValid] = useState<boolean | null>(null)
  const skuTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const [supplierPrices, setSupplierPrices] = useState<SupplierPriceRow[]>([])
  const [materialType, setMaterialType] = useState("")
  const [customSpecs, setCustomSpecs] = useState<SpecRow[]>([])

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useFormValidation(productSchema, {
    defaultValues: {
      name: "", sku: "", description: "",
      unitPrice: 0, costPrice: 0, currency: "THB", vatStatus: "exclude_vat",
      stock: 0, minStock: 0, maxStock: undefined, safetyStock: 0,
      uom: "pcs", leadTime: 0,
      weight: undefined, dimensions: "", externalId: "",
      location: "", image: "",
      categoryId: undefined, supplierId: undefined, warehouseId: undefined, status: "active", barcode: "" } })

  const materialSpecs = watch("materialSpecs" as any) as Record<string, string> | undefined
  const setMaterialSpec = (key: string, value: string) => {
    const current = { ...(materialSpecs || {}) }
    current[key] = value
    setValue("materialSpecs" as any, current as any)
  }

  useEffect(() => {
    Promise.all([
      fetch("/api/categories").then(r => r.json()).catch((err) => { setError(err.message); setLoading(false); return [] }),
      fetch("/api/suppliers").then(r => r.json()).catch((err) => { setError(err.message); setLoading(false); return [] }),
      fetch("/api/warehouses").then(r => r.json()).catch((err) => { setError(err.message); setLoading(false); return [] }),
    ]).then(([cats, sups, whs]) => {
      if (Array.isArray(cats)) setCategories(cats)
      if (Array.isArray(sups)) setSuppliers(sups)
      if (Array.isArray(whs)) setWarehouses(whs)
    })
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault()
        formRef.current?.requestSubmit()
      }
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [])

  const checkSku = useCallback(async (sku: string) => {
    if (!sku || sku.length < 2) { setSkuError(""); setSkuValid(null); return }
    setSkuChecking(true)
    try {
      const res = await fetch("/api/materials", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sku }) })
      const json = await res.json()
      if (json.success && json.data?.exists) { setSkuError("This SKU is already in use"); setSkuValid(false) }
      else { setSkuError(""); setSkuValid(true) }
    } catch { setSkuError("Could not verify SKU"); setSkuValid(null) }
    finally { setSkuChecking(false) }
  }, [])

  const handleSkuChange = (value: string) => {
    setValue("sku", value)
    if (skuTimer.current) clearTimeout(skuTimer.current)
    setSkuValid(null); setSkuError("")
    skuTimer.current = setTimeout(() => checkSku(value), 500)
  }

  const addTag = (tag: string) => {
    const t = tag.trim()
    if (!t || tags.includes(t)) return
    setTags([...tags, t])
    setTagInput("")
  }

  const removeTag = (tag: string) => setTags(tags.filter((t) => t !== tag))

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") { e.preventDefault(); addTag(tagInput) }
    if (e.key === "Backspace" && !tagInput && tags.length > 0) removeTag(tags[tags.length - 1])
  }

  const addSupplierPrice = () => {
    setSupplierPrices([...supplierPrices, {
      tempId: crypto.randomUUID(),
      supplierId: "", price: "0", currency: watch("currency"),
      leadTime: "0", isDefault: supplierPrices.length === 0, notes: ""}])
  }

  const updateSupplierPrice = (tempId: string, field: keyof SupplierPriceRow, value: any) => {
    setSupplierPrices((prev) => prev.map((sp) => sp.tempId === tempId ? { ...sp, [field]: value } : sp))
  }

  const removeSupplierPrice = (tempId: string) => {
    setSupplierPrices((prev) => prev.filter((sp) => sp.tempId !== tempId))
  }

  const addCustomSpec = () => {
    setCustomSpecs([...customSpecs, { id: crypto.randomUUID(), key: "", value: "" }])
  }

  const updateCustomSpec = (id: string, field: "key" | "value", val: string) => {
    setCustomSpecs((prev) => prev.map((s) => s.id === id ? { ...s, [field]: val } : s))
  }

  const removeCustomSpec = (id: string) => {
    setCustomSpecs((prev) => prev.filter((s) => s.id !== id))
  }

  async function onSubmit(data: z.infer<typeof productSchema>) {
    if (skuValid === false) { toast.error("Please use a different SKU"); return }
    if (!materialType) { toast.error("Please select a material type"); return }

    setLoading(true)
    try {
      const specs = materialType === "other"
        ? Object.fromEntries(customSpecs.filter(s => s.key).map(s => [s.key, s.value]))
        : materialSpecs || {}

      const supplierPricesData = supplierPrices
        .filter((sp) => sp.supplierId)
        .map((sp) => ({
          supplierId: sp.supplierId,
          price: sp.price,
          currency: sp.currency,
          leadTime: sp.leadTime || "0",
          isDefault: sp.isDefault,
          notes: sp.notes || undefined}))

      const payload: Record<string, unknown> = {
        ...data,
        materialType,
        materialSpecs: specs,
        weight: data.weight ?? null,
        dimensions: data.dimensions || undefined,
        externalId: data.externalId || undefined,
        tags: tags.length > 0 ? JSON.stringify(tags) : undefined,
        supplierPrices: supplierPricesData.length > 0 ? supplierPricesData : undefined,
        type: "raw_material"}

      const res = await fetch("/api/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)})
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to create")
      }
      const created = await res.json()
      toast.success("Material created successfully", {
        description: `${data.name} (${data.sku})`,
        action: { label: "View", onClick: () => router.push(`/materials/${created.id}`) },
        duration: 5000})
      router.push("/materials")
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create material")
    } finally {
      setLoading(false)
    }
  }

  const wMinStock = watch("minStock") || 0
  const wSafetyStock = watch("safetyStock") || 0
  const wStock = watch("stock") || 0
  const wCostPrice = watch("costPrice") || 0
  const wUnitPrice = watch("unitPrice") || 0
  const reorderPoint = String(Number(wMinStock) + Number(wSafetyStock))

  if (error) return (
    <div className="animate-fade-in pb-8 space-y-4">
      <EmptyState variant="error" title="Failed to load data" description={error} icons={[<AlertTriangle key="e" className="w-6 h-6" />]} actions={[{ label: "Try again", onClick: () => window.location.reload() }]} />
    </div>
  )
  return (
    <div className="animate-fade-in pb-28">
      <div className="page-header mb-5">
        <h1>Add New Material</h1>
        <p>Create a new raw material with industry-specific specifications</p>
      </div>

      <form ref={formRef} onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-8 flex flex-col gap-6">
            {/* Basic Info */}
            <Card>
              <CardHeader className="px-4 pt-4 pb-0">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Package className="w-4 h-4 text-primary" />
                  Basic Information
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="grid grid-cols-6 gap-3">
                  <Field label="Material Name" required className="col-span-3">
                    <Input {...register("name")} placeholder="e.g. Aluminum Sheet 2mm" />
                    {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                  </Field>
                  <Field label="Material Type" required className="col-span-3">
                    <Select options={MATERIAL_TYPES} placeholder="Select type" value={materialType} onChange={(e: any) => setMaterialType(e.target.value)} />
                  </Field>
                </div>
                <div className="grid grid-cols-6 gap-3">
                  <Field label="Material Code (SKU)" required className="col-span-3">
                    <div className="relative">
                      <Input value={watch("sku")} onChange={(e) => handleSkuChange(e.target.value)} placeholder="e.g. AL-SHT-2MM"
                        className={cn("pr-8", skuValid === true && "border-success", skuValid === false && "border-destructive")}
                      />
                      <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                        {skuChecking && <div className="w-3.5 h-3.5 border-2 border-muted-foreground/30 border-t-primary rounded-full animate-spin" />}
                        {skuValid === false && !skuChecking && <AlertCircle className="w-3.5 h-3.5 text-destructive" />}
                      </div>
                    </div>
                    {skuError && <p className="text-xs text-destructive">{skuError}</p>}
                    {skuValid === true && <p className="text-xs text-success">SKU is available</p>}
                  </Field>
                  <Field label="Base Unit" className="col-span-3">
                    <Select options={UOM_OPTIONS} placeholder="Select unit" value={watch("uom")} onChange={(e: any) => setValue("uom", e.target.value)} />
                    {errors.uom && <p className="text-xs text-destructive">{errors.uom.message}</p>}
                  </Field>
                </div>
                <Field label="Description">
                  <Textarea {...register("description")} placeholder="Describe the material — specifications, grade, color, etc." rows={2} />
                  {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
                </Field>
              </CardContent>
            </Card>

            {/* Technical Specifications */}
            <Card>
              <CardHeader className="px-4 pt-4 pb-0">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <FlaskConical className="w-4 h-4 text-primary" />
                  Technical Specifications
                  {materialType && (
                    <span className="text-[10px] font-normal text-muted-foreground bg-surface px-1.5 py-0.5 rounded ml-1">
                      {MATERIAL_TYPES.find(t => t.value === materialType)?.label}
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                {!materialType ? (
                  <p className="text-sm text-muted-foreground text-center py-6">Select a material type above to see specification fields</p>
                ) : materialType === "other" ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">Add custom specification key-value pairs</p>
                      <Button type="button" variant="outline" size="sm" onClick={addCustomSpec}><Plus className="w-3.5 h-3.5" /> Add Spec</Button>
                    </div>
                    {customSpecs.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-4">No custom specs added yet</p>
                    )}
                    {customSpecs.map((spec) => (
                      <div key={spec.id} className="flex items-start gap-2">
                        <Input placeholder="Property name (e.g. Color)" value={spec.key} onChange={(e) => updateCustomSpec(spec.id, "key", e.target.value)} className="flex-1" />
                        <Input placeholder="Value (e.g. Red)" value={spec.value} onChange={(e) => updateCustomSpec(spec.id, "value", e.target.value)} className="flex-1" />
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button type="button" variant="ghost" size="icon" className="size-9 shrink-0" onClick={() => removeCustomSpec(spec.id)}><X className="w-4 h-4" /></Button>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs flex-col items-start gap-1 px-3 py-2 text-left" side="bottom">
                          <p className="text-sm font-medium">Remove</p>
                          <p className="text-background/70 text-xs leading-snug">
                            Remove this specification
                          </p>
                        </TooltipContent>
                        </Tooltip>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-4">
                    {(MATERIAL_SPECS[materialType] || []).map((spec) => (
                      <Field key={spec.key} label={spec.label}>
                        {spec.type === "select" ? (
                          <Select options={spec.options || []} placeholder={spec.placeholder || `Select ${spec.label.toLowerCase()}`} value={materialSpecs?.[spec.key] || ""} onChange={(e: any) => setMaterialSpec(spec.key, e.target.value)} />
                        ) : (
                          <Input type={spec.type} value={materialSpecs?.[spec.key] || ""} onChange={(e) => setMaterialSpec(spec.key, e.target.value)} placeholder={spec.placeholder || `Enter ${spec.label.toLowerCase()}`} />
                        )}
                      </Field>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Inventory & Stock Controls */}
            <Card>
              <CardHeader className="px-4 pt-4 pb-0">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Layers className="w-4 h-4 text-primary" />
                  Inventory & Stock Controls
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="grid grid-cols-4 gap-4">
                  <Field label="Initial Stock">
                    <Input type="number" min="0" {...register("stock")} />
                    {errors.stock && <p className="text-xs text-destructive">{errors.stock.message}</p>}
                  </Field>
                  <Field label="Min Stock">
                    <Input type="number" min="0" {...register("minStock")} />
                    {errors.minStock && <p className="text-xs text-destructive">{errors.minStock.message}</p>}
                  </Field>
                  <Field label="Max Stock">
                    <Input type="number" min="0" {...register("maxStock")} />
                    {errors.maxStock && <p className="text-xs text-destructive">{errors.maxStock.message}</p>}
                  </Field>
                  <Field label={<span className="flex items-center gap-1">Safety Stock <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-muted text-[9px] font-semibold text-muted-foreground cursor-help" title="Buffer stock to prevent out-of-stock">?</span></span>}>
                    <Input type="number" min="0" {...register("safetyStock")} />
                    {errors.safetyStock && <p className="text-xs text-destructive">{errors.safetyStock.message}</p>}
                  </Field>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <Field label={<span className="flex items-center gap-1">Reorder Point <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-muted text-[9px] font-semibold text-muted-foreground cursor-help" title="Min Stock + Safety Stock">?</span></span>}>
                    <Input type="number" value={reorderPoint} readOnly className="bg-surface/50 text-muted-foreground cursor-default" />
                  </Field>
                  <Field label={<span className="flex items-center gap-1">Lead Time (Days) <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-muted text-[9px] font-semibold text-muted-foreground cursor-help" title="Days from order to delivery">?</span></span>}>
                    <Input type="number" min="0" {...register("leadTime")} />
                    {errors.leadTime && <p className="text-xs text-destructive">{errors.leadTime.message}</p>}
                  </Field>
                  <Field label="Warehouse">
                    <Select options={warehouses.map(w => ({ value: w.id, label: w.name }))} placeholder="Select warehouse" value={watch("warehouseId")} onChange={(e: any) => setValue("warehouseId", e.target.value)} />
                    {errors.warehouseId && <p className="text-xs text-destructive">{errors.warehouseId.message}</p>}
                  </Field>
                </div>
                {Number(wStock) > 0 && Number(wMinStock) > 0 && Number(wStock) <= Number(wMinStock) && (
                  <div className="flex items-center gap-2 text-xs text-warning bg-warning/5 rounded-lg px-3 py-2 border border-warning/20">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    Initial stock is at or below minimum stock level
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Procurement */}
            <Card>
              <CardHeader className="px-4 pt-4 pb-0">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <DollarSign className="w-4 h-4 text-primary" />
                  Procurement & Financials
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="grid grid-cols-4 gap-4">
                  <Field label="Primary Supplier">
                    <Combobox value={watch("supplierId") || ""} onValueChange={(v) => setValue("supplierId", v || "")}>
                      <ComboboxInput placeholder="Select supplier" showTrigger />
                      <ComboboxContent>
                        <ComboboxList>
                          {suppliers.map(s => (
                            <ComboboxItem key={s.id} value={s.id}>{s.name}</ComboboxItem>
                          ))}
                          <ComboboxEmpty>No supplier found</ComboboxEmpty>
                        </ComboboxList>
                      </ComboboxContent>
                    </Combobox>
                    {errors.supplierId && <p className="text-xs text-destructive">{errors.supplierId.message}</p>}
                  </Field>
                  <Field label="Cost Price (per UoM)">
                    <Input type="number" step="0.01" min="0" {...register("costPrice")} />
                    {errors.costPrice && <p className="text-xs text-destructive">{errors.costPrice.message}</p>}
                  </Field>
                  <Field label="Currency">
                    <Select options={CURRENCIES} value={watch("currency")} onChange={(e: any) => setValue("currency", e.target.value)} />
                    {errors.currency && <p className="text-xs text-destructive">{errors.currency.message}</p>}
                  </Field>
                  <Field label="Unit Price (Sell)">
                    <Input type="number" step="0.01" min="0" {...register("unitPrice")} />
                    {errors.unitPrice && <p className="text-xs text-destructive">{errors.unitPrice.message}</p>}
                  </Field>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <Field label="VAT Status">
                    <Select options={VAT_OPTIONS} value={watch("vatStatus")} onChange={(e: any) => setValue("vatStatus", e.target.value)} />
                    {errors.vatStatus && <p className="text-xs text-destructive">{errors.vatStatus.message}</p>}
                  </Field>
                </div>
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium">Alternative Suppliers & Pricing</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addSupplierPrice}>Add Supplier</Button>
                  </div>
                  {supplierPrices.length === 0 && (
                    <p className="text-xs text-muted-foreground">Add alternative suppliers with different prices and lead times.</p>
                  )}
                  {supplierPrices.map((sp, idx) => (
                    <div key={sp.tempId} className="flex items-start gap-2 p-3 rounded-lg border border-border bg-surface/30">
                      <div className="flex-1 grid grid-cols-5 gap-2">
                        <div className="space-y-1">
                          <Label className="text-[10px] text-muted-foreground">Supplier</Label>
                          <Select options={suppliers.map(s => ({ value: s.id, label: s.name }))} placeholder="Select" value={sp.supplierId} onChange={(e: any) => updateSupplierPrice(sp.tempId, "supplierId", e.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] text-muted-foreground">Price</Label>
                          <Input type="number" step="0.01" min="0" value={sp.price} onChange={(e) => updateSupplierPrice(sp.tempId, "price", e.target.value)} className="h-8 text-xs" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] text-muted-foreground">Currency</Label>
                          <Select options={CURRENCIES} value={sp.currency} onChange={(e: any) => updateSupplierPrice(sp.tempId, "currency", e.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] text-muted-foreground">Lead Time</Label>
                          <Input type="number" min="0" value={sp.leadTime} onChange={(e) => updateSupplierPrice(sp.tempId, "leadTime", e.target.value)} className="h-8 text-xs" />
                        </div>
                        <div className="space-y-1 flex items-end gap-1">
                          <button type="button" onClick={() => updateSupplierPrice(sp.tempId, "isDefault", true)}
                            className={cn("px-2 py-1.5 rounded text-[10px] font-medium transition-colors h-8", sp.isDefault ? "bg-primary text-primary-foreground" : "bg-surface text-muted-foreground hover:text-foreground")}>Default</button>
                          <button type="button" onClick={() => removeSupplierPrice(sp.tempId)} className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors h-8">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Tags */}
            <Card className="flex-1">
              <CardHeader className="px-4 pt-4 pb-0">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Tags className="w-4 h-4 text-primary" />
                  Tags & Labels
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={handleTagKeyDown} placeholder="Type a tag and press Enter..." />
                  <Button type="button" variant="default" size="sm" onClick={() => addTag(tagInput)} disabled={!tagInput.trim()}>Add</Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="gap-1 pl-2 pr-1 py-1 text-xs">
                        {tag}
                        <button type="button" onClick={() => removeTag(tag)} className="ml-0.5 hover:text-destructive transition-colors"><X className="w-3 h-3" /></button>
                      </Badge>
                    ))}
                  </div>
                )}
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Suggested tags:</p>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_TAGS.filter((t) => !tags.includes(t)).map((tag) => (
                      <button key={tag} type="button" onClick={() => addTag(tag)}
                        className="px-3 py-1 rounded-full border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-surface transition-colors"
                      >+ {tag}</button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="col-span-4 flex flex-col gap-6">
            <Card>
              <CardHeader className="px-4 pt-4 pb-0">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Package className="w-4 h-4 text-primary" />
                  Image
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <ImageGallery maxFiles={1} onFilesChange={(files) => {
                  if (files.length > 0) {
                    const f = files[0]
                    if (f.preview) {
                      if (f.preview.startsWith("blob:")) {
                        const reader = new FileReader()
                        reader.onload = (ev) => setValue("image", ev.target?.result as string)
                        reader.readAsDataURL(f.file)
                      } else {
                        setValue("image", f.preview)
                      }
                    }
                  } else {
                    setValue("image", "")
                  }
                }} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="px-4 pt-4 pb-0">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Boxes className="w-4 h-4 text-primary" />
                  Classification
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <Field label="Category">
                  <Combobox value={watch("categoryId") || ""} onValueChange={(v) => setValue("categoryId", v || "")}>
                    <ComboboxInput placeholder="Select category" showTrigger />
                    <ComboboxContent>
                      <ComboboxList>
                        {categories.map(c => (
                          <ComboboxItem key={c.id} value={c.id}>{c.name}</ComboboxItem>
                        ))}
                        <ComboboxEmpty>No category found</ComboboxEmpty>
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                  {errors.categoryId && <p className="text-xs text-destructive">{errors.categoryId.message}</p>}
                </Field>
                <Field label="Status">
                  <Combobox value={watch("status") || "active"} onValueChange={(v) => setValue("status", v || "active")}>
                    <ComboboxInput placeholder="Select status" showTrigger />
                    <ComboboxContent>
                      <ComboboxList>
                        {STATUS_OPTIONS.map(s => (
                          <ComboboxItem key={s.value} value={s.value}>{s.label}</ComboboxItem>
                        ))}
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                  {errors.status && <p className="text-xs text-destructive">{errors.status.message}</p>}
                </Field>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="px-4 pt-4 pb-0">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <MapPin className="w-4 h-4 text-primary" />
                  Location
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <Field label="Aisle / Bin">
                    <Input placeholder="Aisle-Bin" {...register("location")} />
                    {errors.location && <p className="text-xs text-destructive">{errors.location.message}</p>}
                  </Field>
                  <Field label={<span className="flex items-center gap-1">Weight (kg) <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-muted text-[9px] font-semibold text-muted-foreground cursor-help" title="For warehouse space utilization">?</span></span>}>
                    <Input type="number" step="0.001" min="0" {...register("weight")} placeholder="0.000" />
                    {errors.weight && <p className="text-xs text-destructive">{errors.weight.message}</p>}
                  </Field>
                  <Field label={<span className="flex items-center gap-1">Dimensions <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-muted text-[9px] font-semibold text-muted-foreground cursor-help" title="Width x Length x Height (cm)">?</span></span>}>
                    <Input {...register("dimensions")} placeholder="e.g. 30x20x10 cm" />
                    {errors.dimensions && <p className="text-xs text-destructive">{errors.dimensions.message}</p>}
                  </Field>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>

      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-background/95 backdrop-blur-sm shadow-lg shadow-black/5 ml-60">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div />
          <div className="flex items-center gap-3">
            <Button type="button" variant="ghost" size="sm" onClick={() => router.back()}>Cancel</Button>
            <Button loading={loading} size="sm" onClick={() => formRef.current?.requestSubmit()}>Create Material <kbd className="ml-1.5 px-1.5 py-0.5 rounded border border-primary-foreground/20 text-[10px] font-mono bg-primary-foreground/10">⌘↵</kbd></Button>
          </div>
        </div>
      </div>
    </div>
  )
}
