
import React, { useState } from 'react';
import { Product, UserRole, Category } from './types';
import { generateTryOnImage } from './services/geminiService';
import { Button } from './components/Button';
import { ImageInput } from './components/ImageInput';
import { 
  ShoppingBag, 
  Camera, 
  ArrowLeft, 
  Plus, 
  Share2, 
  Check, 
  Wand2,
  Store,
  User,
  Sparkles,
  Tag,
  Layers,
  Trash2,
  Barcode
} from 'lucide-react';

// --- MOCK DATA ---

const INITIAL_CATEGORIES: Category[] = [
  {
    id: 'c1',
    name: 'Chaquetas',
    imageUrl: 'https://images.unsplash.com/photo-1551028919-ac7eed881093?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'c2',
    name: 'Vestidos',
    imageUrl: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'c3',
    name: 'Sudaderas',
    imageUrl: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'
  }
];

const INITIAL_PRODUCTS: Product[] = [
  {
    id: '1',
    sku: 'VINT-001',
    name: 'Cazadora Vaquera Vintage',
    price: 89.99,
    category: 'Chaquetas',
    tags: ['vintage', 'denim', 'casual', 'invierno'],
    description: 'Cazadora vaquera clásica lavada con estilo retro y corte relajado.',
    imageUrl: 'https://images.unsplash.com/photo-1523205565295-f8e91625443b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  },
  {
    id: '2',
    sku: 'SMMR-DRS-02',
    name: 'Vestido Floral de Verano',
    price: 45.50,
    category: 'Vestidos',
    tags: ['verano', 'floral', 'ligero', 'playa'],
    description: 'Vestido ligero de algodón con estampado floral, perfecto para días soleados.',
    imageUrl: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  },
  {
    id: '3',
    sku: 'URBN-HD-99',
    name: 'Sudadera Urbana Street',
    price: 65.00,
    category: 'Sudaderas',
    tags: ['streetwear', 'negro', 'oversize', 'algodón'],
    description: 'Sudadera negra oversize de estilo urbano con diseño minimalista.',
    imageUrl: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  }
];

export default function App() {
  // State
  const [role, setRole] = useState<UserRole>(UserRole.NONE);
  const [catalog, setCatalog] = useState<Product[]>(INITIAL_PRODUCTS);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  
  // Merchant State
  const [merchantTab, setMerchantTab] = useState<'products' | 'categories'>('products');
  
  // -- Merchant: New Product State
  const [newItem, setNewItem] = useState<Partial<Product>>({ 
    name: '', 
    sku: '',
    price: 0, 
    description: '', 
    category: '', 
    tags: [] 
  });
  const [newItemTagsInput, setNewItemTagsInput] = useState('');
  const [newItemImage, setNewItemImage] = useState<string | null>(null);

  // -- Merchant: New Category State
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryImage, setNewCategoryImage] = useState<string | null>(null);

  // Shopper State
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [customInstructions, setCustomInstructions] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Handlers ---

  const handleRoleSelect = (selectedRole: UserRole) => {
    setRole(selectedRole);
    setSelectedProduct(null);
    setGeneratedImage(null);
    setError(null);
  };

  // Merchant: Add Product
  const handleAddItem = () => {
    if (!newItem.name || !newItem.sku || !newItem.price || !newItemImage || !newItem.category) return;

    // Process tags
    const tagsArray = newItemTagsInput
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    const product: Product = {
      id: Date.now().toString(),
      sku: newItem.sku,
      name: newItem.name,
      price: newItem.price,
      description: newItem.description || '',
      category: newItem.category,
      tags: tagsArray,
      imageUrl: newItemImage
    };

    setCatalog(prev => [product, ...prev]);
    
    // Reset form
    setNewItem({ name: '', sku: '', price: 0, description: '', category: '', tags: [] });
    setNewItemTagsInput('');
    setNewItemImage(null);
    alert("¡Artículo añadido al catálogo correctamente!");
  };

  // Merchant: Add Category
  const handleAddCategory = () => {
    if (!newCategoryName || !newCategoryImage) return;

    const newCat: Category = {
      id: `cat-${Date.now()}`,
      name: newCategoryName,
      imageUrl: newCategoryImage
    };

    setCategories(prev => [...prev, newCat]);
    setNewCategoryName('');
    setNewCategoryImage(null);
    alert("¡Categoría creada correctamente!");
  };

  // Delete Helpers (Optional but good for UX)
  const handleDeleteProduct = (id: string) => {
    setCatalog(prev => prev.filter(p => p.id !== id));
  };

  const handleDeleteCategory = (id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  // Shopper: Try On
  const handleTryOn = async () => {
    if (!userPhoto || !selectedProduct) {
      setError("Por favor, asegúrate de subir tu foto y seleccionar una prenda.");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const resultBase64 = await generateTryOnImage({
        userImage: userPhoto,
        productImage: selectedProduct.imageUrl,
        instructions: customInstructions
      });
      setGeneratedImage(resultBase64);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al generar la imagen. Inténtalo de nuevo.");
    } finally {
      setIsGenerating(false);
    }
  };

  const shareOnWhatsApp = () => {
    if (!generatedImage) return;
    const text = `¡Mira cómo me queda este/a ${selectedProduct?.name}! Creado con ModaFlow Probador Virtual.`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // --- Views ---

  // 1. Landing / Role Selection
  if (role === UserRole.NONE) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-4xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
          <div className="p-12 md:w-1/2 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-6">
              <div className="bg-indigo-600 p-2 rounded-lg">
                <Sparkles className="text-white w-6 h-6" />
              </div>
              <h1 className="text-3xl font-bold text-slate-900">ModaFlow</h1>
            </div>
            <p className="text-slate-600 mb-8 text-lg leading-relaxed">
              Plataforma SaaS de moda con IA. Gestiona tu tienda, crea categorías y ofrece probadores virtuales a tus clientes al instante.
            </p>
            
            <div className="space-y-4">
              <button 
                onClick={() => handleRoleSelect(UserRole.MERCHANT)}
                className="w-full p-4 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50 transition-all flex items-center gap-4 group text-left shadow-sm"
              >
                <div className="bg-blue-100 p-3 rounded-full text-blue-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <Store className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Soy Comerciante</h3>
                  <p className="text-sm text-slate-500">Gestionar productos, categorías y etiquetas</p>
                </div>
              </button>

              <button 
                onClick={() => handleRoleSelect(UserRole.SHOPPER)}
                className="w-full p-4 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50 transition-all flex items-center gap-4 group text-left shadow-sm"
              >
                <div className="bg-purple-100 p-3 rounded-full text-purple-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Soy Cliente</h3>
                  <p className="text-sm text-slate-500">Probarme ropa virtualmente</p>
                </div>
              </button>
            </div>
          </div>
          <div className="hidden md:block md:w-1/2 bg-indigo-600 relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1483985988355-763728e1935b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80')] bg-cover bg-center opacity-40 mix-blend-overlay"></div>
            <div className="relative z-10 p-12 h-full flex flex-col justify-end text-white">
              <h2 className="text-2xl font-bold mb-2">Probador Virtual IA</h2>
              <p className="text-indigo-100">Potenciado por Gemini 2.5 Flash Image</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. Merchant Dashboard
  if (role === UserRole.MERCHANT) {
    return (
      <div className="min-h-screen bg-slate-50 pb-20">
        <nav className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
          <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button onClick={() => setRole(UserRole.NONE)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
              <h1 className="text-xl font-bold text-slate-800">Panel de Comerciante</h1>
            </div>
            
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button 
                onClick={() => setMerchantTab('products')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  merchantTab === 'products' 
                    ? 'bg-white text-indigo-600 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Productos
              </button>
              <button 
                onClick={() => setMerchantTab('categories')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  merchantTab === 'categories' 
                    ? 'bg-white text-indigo-600 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Categorías
              </button>
            </div>
          </div>
        </nav>

        <div className="max-w-6xl mx-auto px-4 py-8">
          
          {/* --- PRODUCTS TAB --- */}
          {merchantTab === 'products' && (
            <div className="space-y-8 animate-fadeIn">
              {/* Add Product Form */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-800">
                  <Plus className="w-5 h-5 text-indigo-600" />
                  Añadir Nuevo Producto
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                  <div className="md:col-span-4">
                    <ImageInput 
                      label="Foto del Producto" 
                      imageSrc={newItemImage} 
                      onChange={setNewItemImage} 
                      placeholder="Subir Prenda"
                      height="h-72"
                    />
                  </div>
                  <div className="md:col-span-8 space-y-4">
                    
                    {/* First Row: Name & SKU */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
                        <input 
                          type="text" 
                          value={newItem.name}
                          onChange={e => setNewItem({...newItem, name: e.target.value})}
                          className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                          placeholder="ej: Chaqueta Aviador"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">SKU (Referencia)</label>
                        <input 
                          type="text" 
                          value={newItem.sku || ''}
                          onChange={e => setNewItem({...newItem, sku: e.target.value})}
                          className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-mono text-sm"
                          placeholder="ej: SKU-12345"
                        />
                      </div>
                    </div>

                    {/* Second Row: Price & Category */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Precio (€)</label>
                        <input 
                          type="number" 
                          value={newItem.price || ''}
                          onChange={e => setNewItem({...newItem, price: parseFloat(e.target.value)})}
                          className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Categoría</label>
                        <select 
                          value={newItem.category}
                          onChange={e => setNewItem({...newItem, category: e.target.value})}
                          className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                        >
                          <option value="">Seleccionar Categoría...</option>
                          {categories.map(cat => (
                            <option key={cat.id} value={cat.name}>{cat.name}</option>
                          ))}
                        </select>
                        {categories.length === 0 && (
                          <p className="text-xs text-amber-600 mt-1">¡Crea categorías primero en la pestaña de Categorías!</p>
                        )}
                      </div>
                    </div>

                    {/* Third Row: Tags */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Etiquetas <span className="text-slate-400 font-normal">(separadas por coma)</span>
                        </label>
                        <input 
                          type="text" 
                          value={newItemTagsInput}
                          onChange={e => setNewItemTagsInput(e.target.value)}
                          className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                          placeholder="ej: invierno, oferta, nuevo"
                        />
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
                      <textarea 
                        value={newItem.description}
                        onChange={e => setNewItem({...newItem, description: e.target.value})}
                        className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none"
                        placeholder="Detalles sobre el material, ajuste, etc..."
                      />
                    </div>
                    <div className="pt-2 flex justify-end">
                       <Button onClick={handleAddItem} disabled={!newItem.name || !newItem.price || !newItemImage || !newItem.category || !newItem.sku}>
                         Añadir al Catálogo
                       </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Product List */}
              <div>
                <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-slate-600" />
                  Inventario ({catalog.length})
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {catalog.map(item => (
                    <div key={item.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col group relative">
                      <button 
                        onClick={() => handleDeleteProduct(item.id)}
                        className="absolute top-2 right-2 bg-white/90 p-2 rounded-full text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-sm"
                        title="Eliminar producto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="aspect-[4/3] relative">
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                        <div className="absolute bottom-2 left-2">
                          <span className="bg-black/60 text-white text-xs px-2 py-1 rounded-md backdrop-blur-sm">
                            {item.category}
                          </span>
                        </div>
                      </div>
                      <div className="p-4 flex-1 flex flex-col">
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="font-bold text-slate-900 truncate flex-1 mr-2">{item.name}</h3>
                          <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200 font-mono">
                            {item.sku}
                          </span>
                        </div>
                        <p className="text-indigo-600 font-bold mb-2">{item.price.toFixed(2)} €</p>
                        
                        <div className="flex flex-wrap gap-1 mt-auto">
                          {item.tags?.map((tag, idx) => (
                            <span key={idx} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                  {catalog.length === 0 && (
                     <div className="col-span-full py-12 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                       No hay productos. ¡Añade el primero!
                     </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* --- CATEGORIES TAB --- */}
          {merchantTab === 'categories' && (
             <div className="space-y-8 animate-fadeIn">
               {/* Add Category Form */}
               <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                 <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-800">
                   <Layers className="w-5 h-5 text-indigo-600" />
                   Crear Nueva Categoría
                 </h2>
                 <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                    <div className="md:col-span-4">
                       <ImageInput 
                         label="Imagen de Portada" 
                         imageSrc={newCategoryImage} 
                         onChange={setNewCategoryImage} 
                         placeholder="Subir Portada"
                         height="h-56"
                       />
                    </div>
                    <div className="md:col-span-8 flex flex-col gap-4">
                       <div>
                         <label className="block text-sm font-medium text-slate-700 mb-1">Nombre de la Categoría</label>
                         <input 
                           type="text" 
                           value={newCategoryName}
                           onChange={e => setNewCategoryName(e.target.value)}
                           className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                           placeholder="ej: Zapatos, Accesorios..."
                         />
                       </div>
                       <div className="bg-blue-50 text-blue-800 p-4 rounded-lg text-sm">
                         <p>Consejo: Usa imágenes representativas de alta calidad para las portadas de categoría. Esto ayudará a tus clientes a navegar mejor por tu tienda.</p>
                       </div>
                       <div className="flex justify-end mt-2">
                         <Button onClick={handleAddCategory} disabled={!newCategoryName || !newCategoryImage}>
                           Guardar Categoría
                         </Button>
                       </div>
                    </div>
                 </div>
               </div>

               {/* Category List */}
               <div>
                  <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-slate-600" />
                    Categorías Activas ({categories.length})
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {categories.map(cat => (
                      <div key={cat.id} className="group relative bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <button 
                          onClick={() => handleDeleteCategory(cat.id)}
                          className="absolute top-2 right-2 bg-white/90 p-1.5 rounded-full text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-sm"
                          title="Eliminar categoría"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                        <div className="aspect-square relative">
                          <img src={cat.imageUrl} alt={cat.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-80"></div>
                          <div className="absolute bottom-0 left-0 right-0 p-3">
                            <h3 className="text-white font-bold text-center truncate">{cat.name}</h3>
                          </div>
                        </div>
                      </div>
                    ))}
                    {categories.length === 0 && (
                       <div className="col-span-full py-12 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                         No hay categorías creadas.
                       </div>
                    )}
                  </div>
               </div>
             </div>
          )}

        </div>
      </div>
    );
  }

  // 3. Shopper View
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
             <button onClick={() => setRole(UserRole.NONE)} className="p-2 hover:bg-slate-100 rounded-full">
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
            <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent hidden md:block">
              ModaFlow <span className="text-slate-400 font-normal text-sm">| Probador Virtual</span>
            </h1>
            <h1 className="text-xl font-bold text-indigo-600 md:hidden">ModaFlow</h1>
          </div>
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-slate-600" />
            <span className="font-medium text-slate-700 hidden sm:inline">{catalog.length} Prendas</span>
          </div>
        </div>
      </nav>

      <div className="flex-1 flex flex-col lg:flex-row max-w-7xl mx-auto w-full p-4 gap-6">
        
        {/* Left: Product Catalog */}
        <div className="lg:w-1/3 h-full lg:overflow-y-auto pr-2 custom-scrollbar">
          
          {/* Category Filter (Horizontal Scroll) */}
          <div className="mb-6 overflow-x-auto pb-2 flex gap-3 no-scrollbar">
            {categories.map(cat => (
              <div key={cat.id} className="flex-shrink-0 flex flex-col items-center gap-1 cursor-pointer group min-w-[70px]">
                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-slate-200 group-hover:border-indigo-500 transition-colors p-0.5">
                   <img src={cat.imageUrl} alt={cat.name} className="w-full h-full rounded-full object-cover" />
                </div>
                <span className="text-xs font-medium text-slate-600 group-hover:text-indigo-600">{cat.name}</span>
              </div>
            ))}
          </div>

          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 sticky top-0 bg-slate-50 py-2 z-10">Últimas Novedades</h2>
          <div className="space-y-4 pb-20 lg:pb-0">
            {catalog.map(product => (
              <div 
                key={product.id}
                onClick={() => setSelectedProduct(product)}
                className={`flex gap-3 p-3 rounded-xl cursor-pointer transition-all border group ${
                  selectedProduct?.id === product.id 
                    ? 'bg-white border-indigo-500 ring-1 ring-indigo-500 shadow-md' 
                    : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-sm'
                }`}
              >
                <img src={product.imageUrl} alt={product.name} className="w-20 h-24 object-cover rounded-lg bg-slate-100" />
                <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                  <div>
                    <div className="flex justify-between items-start">
                       <h4 className="font-semibold text-slate-900 truncate pr-2">{product.name}</h4>
                       {selectedProduct?.id === product.id && <Check className="w-5 h-5 text-indigo-600 flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{product.category}</p>
                  </div>
                  
                  <div className="flex items-end justify-between mt-2">
                     <div className="flex gap-1 overflow-hidden">
                        {product.tags?.slice(0, 2).map((tag, i) => (
                           <span key={i} className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">#{tag}</span>
                        ))}
                     </div>
                     <p className="text-sm text-indigo-600 font-bold">{product.price.toFixed(2)} €</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Middle: Try-On Area */}
        <div className="flex-1 bg-white rounded-3xl shadow-sm border border-slate-200 p-6 flex flex-col h-fit lg:sticky lg:top-24">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Camera className="w-5 h-5 text-indigo-600" />
              Probador Virtual
            </h2>
            {selectedProduct && (
              <span className="hidden sm:inline-block text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full font-bold border border-indigo-100">
                {selectedProduct.name}
              </span>
            )}
          </div>

          <div className="flex-1 flex flex-col gap-6">
            {/* Input Zone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <ImageInput 
                 label="1. Tu Foto (Cuerpo Entero)" 
                 imageSrc={userPhoto} 
                 onChange={setUserPhoto} 
                 placeholder="Subir tu foto"
                 height="h-64 sm:h-80"
               />
               
               <div className="flex flex-col h-64 sm:h-80">
                 <label className="block text-sm font-medium text-slate-700 mb-2">2. Prenda Seleccionada</label>
                 {selectedProduct ? (
                   <div className="flex-1 rounded-xl overflow-hidden border border-slate-200 relative group">
                     <img src={selectedProduct.imageUrl} className="w-full h-full object-cover" alt="Selected" />
                     <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                        <span className="bg-white/90 text-slate-900 text-xs px-2 py-1 rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                           {selectedProduct.category}
                        </span>
                     </div>
                   </div>
                 ) : (
                   <div className="flex-1 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 bg-slate-50 gap-2 p-4 text-center">
                     <ShoppingBag className="w-8 h-8 opacity-50" />
                     <p className="text-sm">Selecciona una prenda del catálogo a la izquierda</p>
                   </div>
                 )}
               </div>
            </div>

            {/* Controls */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <label className="block text-sm font-medium text-slate-700 flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-indigo-500" />
                Instrucciones IA (Opcional)
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input 
                  type="text" 
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  className="flex-1 p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="ej: Meter camisa, ajustar mangas..."
                />
                <Button 
                  onClick={handleTryOn} 
                  disabled={!userPhoto || !selectedProduct}
                  isLoading={isGenerating}
                  className="sm:w-40 w-full"
                >
                  <Sparkles className="w-4 h-4" />
                  PROBAR
                </Button>
              </div>
              {error && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100 flex items-start gap-2">
                  <div className="mt-0.5">⚠️</div>
                  <p>{error}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right (or Modal on mobile): Result */}
        {(generatedImage || isGenerating) && (
          <div className="lg:w-1/4 flex flex-col bg-white border-l lg:border-l-0 border-slate-200 p-4 shadow-2xl lg:shadow-none fixed right-0 top-0 bottom-0 z-50 lg:relative lg:z-0 lg:bg-transparent lg:p-0 w-full sm:w-96 lg:w-auto transform transition-transform duration-300 ease-in-out">
             <div className="lg:hidden flex justify-between items-center mb-4">
               <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                 <Sparkles className="w-5 h-5 text-amber-500" />
                 Resultado
               </h2>
               <button onClick={() => setGeneratedImage(null)} className="p-2 hover:bg-slate-100 rounded-full">
                  <ArrowLeft className="w-5 h-5 text-slate-600" />
               </button>
             </div>
             
             <div className="hidden lg:flex items-center gap-2 mb-4">
                 <Sparkles className="w-5 h-5 text-amber-500" />
                 <h2 className="text-lg font-bold text-slate-800">Resultado</h2>
             </div>
             
             <div className="flex-1 bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200 relative min-h-[400px] lg:h-auto">
               {isGenerating ? (
                 <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 text-slate-500 space-y-4 p-6 text-center">
                   <div className="relative">
                     <div className="w-16 h-16 border-4 border-indigo-100 rounded-full"></div>
                     <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                   </div>
                   <p className="animate-pulse font-medium text-indigo-900">
                     Analizando prendas y ajustando tallas...
                   </p>
                   <p className="text-xs text-slate-400 max-w-[200px]">Esto suele tardar unos 10-15 segundos con Gemini Flash.</p>
                 </div>
               ) : generatedImage ? (
                 <div className="w-full h-full relative group">
                    <img src={generatedImage} alt="Resultado" className="w-full h-full object-contain bg-slate-100" />
                 </div>
               ) : null}
             </div>

             {generatedImage && !isGenerating && (
               <div className="mt-4 space-y-3 pb-8 lg:pb-0">
                 <Button variant="whatsapp" className="w-full" onClick={shareOnWhatsApp}>
                   <Share2 className="w-4 h-4" />
                   Compartir en WhatsApp
                 </Button>
                 <Button variant="secondary" className="w-full" onClick={() => {
                    const link = document.createElement('a');
                    link.href = generatedImage;
                    link.download = `modaflow-tryon-${Date.now()}.png`;
                    link.click();
                 }}>
                   Descargar Imagen
                 </Button>
                 <p className="text-xs text-center text-slate-400 mt-2">
                   Generado por Gemini 2.5 Flash Image
                 </p>
               </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
}