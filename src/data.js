export const suggestions = [
  { category: 'Meat Dish', name: 'Braised Short Ribs', description: 'Tender beef short ribs slow-braised in red wine and herbs.' },
  { category: 'Vegetable Dish', name: 'Roasted Cauliflower', description: 'Crispy roasted cauliflower with tahini drizzle and pomegranate.' },
  { category: 'Soup', name: 'Tomato Basil Soup', description: 'Classic creamy tomato soup with fresh basil and croutons.' },
  { category: 'Drink', name: 'Mango Lassi', description: 'Chilled yogurt smoothie blended with ripe mango and cardamom.' },
]

export const initialDishes = [
  { id: 1, name: 'Pasta Carbonara', description: 'Creamy Italian pasta with pancetta, egg, and parmesan.', ingredients: ['spaghetti', 'pancetta', 'eggs', 'parmesan', 'black pepper'] },
  { id: 2, name: 'Chicken Stir Fry', description: 'Quick veggie and chicken stir fry with soy-ginger sauce.', ingredients: ['chicken breast', 'bell pepper', 'broccoli', 'soy sauce', 'ginger', 'garlic'] },
  { id: 3, name: 'Margherita Pizza', description: 'Classic pizza with fresh mozzarella, basil, and tomato.', ingredients: ['pizza dough', 'mozzarella', 'tomato', 'basil', 'olive oil'] },
  { id: 4, name: 'Beef Tacos', description: 'Seasoned ground beef tacos with salsa, cheese, and cilantro.', ingredients: ['ground beef', 'taco shells', 'salsa', 'cheddar', 'cilantro', 'onion'] },
  { id: 5, name: 'Greek Salad', description: 'Cucumber, tomato, olives, and feta with lemon dressing.', ingredients: ['cucumber', 'tomato', 'olives', 'feta', 'lemon', 'olive oil'] },
  { id: 6, name: 'Salmon Teriyaki', description: 'Pan-seared salmon glazed with homemade teriyaki sauce.', ingredients: ['salmon fillet', 'soy sauce', 'mirin', 'sugar', 'ginger', 'garlic'] },
  { id: 7, name: 'Vegetable Curry', description: 'Hearty coconut curry loaded with seasonal vegetables.', ingredients: ['coconut milk', 'curry paste', 'potato', 'carrot', 'bell pepper', 'onion'] },
  { id: 8, name: 'Mushroom Risotto', description: 'Creamy arborio rice with mixed mushrooms and parmesan.', ingredients: ['arborio rice', 'mushrooms', 'parmesan', 'onion', 'garlic', 'white wine'] },
]

// `key` maps to the i18n nav.<key> translation; labels are resolved in Layout.
export const navItems = [
  { key: 'home', path: '/', icon: 'bi-house-door' },
  { key: 'menu', path: '/menu', icon: 'bi-book' },
  { key: 'favorites', path: '/favorites', icon: 'bi-heart' },
  { key: 'shopping', path: '/shopping', icon: 'bi-cart' },
  { key: 'family', path: '/family', icon: 'bi-people' },
  { key: 'settings', path: '/settings', icon: 'bi-gear' },
]

export const familyMembers = [
  { name: 'Alice', initial: 'A' },
  { name: 'Bob', initial: 'B' },
  { name: 'Charlie', initial: 'C' },
]
