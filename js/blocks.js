// Block registry. Pure data + tiny helpers. No imports, so it works in browser and Node.
// IDs are stable (saved worlds depend on them): ONLY APPEND new blocks at the end.

export const FACE = { E: 0, W: 1, U: 2, D: 3, S: 4, N: 5 };           // +X -X +Y -Y +Z -Z
export const FACE_DIR = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
export const FACING_FACE = [FACE.N, FACE.E, FACE.S, FACE.W];            // facing index -> face
export const R = { NONE: 255, CUBE: 0, CROSS: 1, LIQUID: 2, TORCH: 3, SLAB: 4, STAIRS: 5, SNOW: 6, CACTUS: 7 };
export const L = { OPAQUE: 0, CUTOUT: 1, TRANS: 2 };                    // render pass
export const WOOL_NAMES = ['White', 'Orange', 'Magenta', 'Light Blue', 'Yellow', 'Lime', 'Pink', 'Gray',
  'Light Gray', 'Cyan', 'Purple', 'Blue', 'Brown', 'Green', 'Red', 'Black'];

export const blocks = [];       // by id -> definition object
export const ID = {};           // name -> id

// Fast typed lookup tables (index = block id). Used by light engine + mesher hot loops.
export const OPAQUE = new Uint8Array(256);    // full opaque cube (face culling + AO)
export const OPACITY = new Uint8Array(256);   // light absorbed 0..15
export const EMIT = new Uint8Array(256);      // light emitted 0..15
export const SOLID = new Uint8Array(256);     // has collision
export const RENDER = new Uint8Array(256).fill(R.NONE);
export const LAYER = new Uint8Array(256);
export const FLUID = new Uint8Array(256);
export const REPLACEABLE = new Uint8Array(256);
export const FACE_TEX = new Uint16Array(256 * 6);  // texture layer per face (filled by resolveTextures)
export const FRONT_TEX = new Uint16Array(256);     // front texture for facing blocks

function def(id, name, label, o = {}) {
  const b = Object.assign({
    id, name, label,
    render: R.CUBE, layer: L.OPAQUE,
    solid: true, opaque: true, opacity: 15, emit: 0,
    hardness: 1, tool: null, tier: 0, needsTool: false,
    sound: 'stone', tint: null, tex: name,
    replaceable: false, fluid: false, gravity: false, slip: 0.6,
    texData: false,   // layer = base + (data & 15)   (wool)
    facing: false,    // front texture on the face given by data & 3
    anim: 0,          // 1 = water frames, 2 = lava frames
    damage: 0,        // contact damage per second (cactus)
  }, o);
  if (!b.opaque && o.opacity === undefined) b.opacity = 0;
  blocks[id] = b;
  ID[name] = id;
  OPAQUE[id] = b.opaque ? 1 : 0;
  OPACITY[id] = b.opacity;
  EMIT[id] = b.emit;
  SOLID[id] = b.solid ? 1 : 0;
  RENDER[id] = b.render;
  LAYER[id] = b.layer;
  FLUID[id] = b.fluid ? 1 : 0;
  REPLACEABLE[id] = b.replaceable ? 1 : 0;
  return b;
}

const PLANT = { render: R.CROSS, layer: L.CUTOUT, solid: false, opaque: false, hardness: 0, sound: 'grass' };
const STONEY = { tool: 'pickaxe', needsTool: true, sound: 'stone' };
const WOODY = { tool: 'axe', sound: 'wood' };
const SLAB = { render: R.SLAB, opaque: false, hardness: 2, tool: 'pickaxe', needsTool: true };
const STAIRS = { render: R.STAIRS, opaque: false, hardness: 2, tool: 'pickaxe', needsTool: true };
const CUT = { layer: L.CUTOUT, opaque: false };

def(0, 'air', 'Air', { render: R.NONE, solid: false, opaque: false, replaceable: true, hardness: -1 });
def(1, 'stone', 'Stone', { ...STONEY, hardness: 1.5 });
def(2, 'grass', 'Grass Block', { tex: { top: 'grass_top', bottom: 'dirt', side: 'grass_side' }, hardness: 0.6, tool: 'shovel', sound: 'grass', tint: 'grass' });
def(3, 'dirt', 'Dirt', { hardness: 0.5, tool: 'shovel', sound: 'gravel' });
def(4, 'cobblestone', 'Cobblestone', { ...STONEY, hardness: 2 });
def(5, 'planks_oak', 'Oak Wood Planks', { ...WOODY, hardness: 2 });
def(6, 'sapling_oak', 'Oak Sapling', { ...PLANT, tex: 'sapling_oak' });
def(7, 'bedrock', 'Bedrock', { hardness: -1 });
def(8, 'water', 'Water', { render: R.LIQUID, layer: L.TRANS, solid: false, opaque: false, opacity: 3, fluid: true, replaceable: true, tint: 'water', anim: 1, tex: 'water_0', hardness: -1 });
def(9, 'lava', 'Lava', { render: R.LIQUID, layer: L.OPAQUE, solid: false, opaque: false, opacity: 0, emit: 15, fluid: true, replaceable: true, anim: 2, tex: 'lava_0', hardness: -1 });
def(10, 'sand', 'Sand', { hardness: 0.5, tool: 'shovel', sound: 'sand', gravity: true });
def(11, 'gravel', 'Gravel', { hardness: 0.6, tool: 'shovel', sound: 'gravel', gravity: true });
def(12, 'gold_ore', 'Gold Ore', { ...STONEY, hardness: 3, tier: 2 });
def(13, 'iron_ore', 'Iron Ore', { ...STONEY, hardness: 3, tier: 1 });
def(14, 'coal_ore', 'Coal Ore', { ...STONEY, hardness: 3, tier: 0 });
def(15, 'log_oak', 'Oak Log', { ...WOODY, hardness: 2, tex: { top: 'log_oak_top', bottom: 'log_oak_top', side: 'log_oak' } });
def(16, 'leaves_oak', 'Oak Leaves', { ...CUT, opacity: 1, hardness: 0.2, tint: 'foliage', sound: 'grass', tex: 'leaves_oak' });
def(17, 'glass', 'Glass', { ...CUT, hardness: 0.3, sound: 'glass' });
def(18, 'lapis_ore', 'Lapis Lazuli Ore', { ...STONEY, hardness: 3, tier: 1 });
def(19, 'lapis_block', 'Lapis Lazuli Block', { ...STONEY, hardness: 3, tier: 1 });
def(20, 'sandstone', 'Sandstone', { ...STONEY, hardness: 0.8, tex: { top: 'sandstone_top', bottom: 'sandstone_bottom', side: 'sandstone_side' } });
def(21, 'wool', 'Wool', { hardness: 0.8, sound: 'cloth', tex: 'wool_0', texData: true });
def(22, 'dandelion', 'Dandelion', { ...PLANT, tex: 'dandelion' });
def(23, 'poppy', 'Poppy', { ...PLANT, tex: 'poppy' });
def(24, 'gold_block', 'Block of Gold', { ...STONEY, hardness: 3, tier: 0 });
def(25, 'iron_block', 'Block of Iron', { ...STONEY, hardness: 5, tier: 1 });
def(26, 'diamond_block', 'Block of Diamond', { ...STONEY, hardness: 5, tier: 2 });
def(27, 'slab_stone', 'Stone Slab', { ...SLAB, tex: 'stone' });
def(28, 'slab_cobble', 'Cobblestone Slab', { ...SLAB, tex: 'cobblestone' });
def(29, 'slab_oak', 'Oak Wood Slab', { ...SLAB, ...WOODY, needsTool: false, tex: 'planks_oak' });
def(30, 'slab_sandstone', 'Sandstone Slab', { ...SLAB, tex: { top: 'sandstone_top', bottom: 'sandstone_bottom', side: 'sandstone_side' } });
def(31, 'slab_brick', 'Brick Slab', { ...SLAB, tex: 'bricks' });
def(32, 'slab_stonebrick', 'Stone Brick Slab', { ...SLAB, tex: 'stonebrick' });
def(33, 'bricks', 'Bricks', { ...STONEY, hardness: 2 });
def(34, 'tnt', 'TNT', { hardness: 0, sound: 'grass', tex: { top: 'tnt_top', bottom: 'tnt_bottom', side: 'tnt_side' } });
def(35, 'bookshelf', 'Bookshelf', { ...WOODY, hardness: 1.5, tex: { top: 'planks_oak', bottom: 'planks_oak', side: 'bookshelf' } });
def(36, 'mossy_cobblestone', 'Moss Stone', { ...STONEY, hardness: 2 });
def(37, 'obsidian', 'Obsidian', { ...STONEY, hardness: 50, tier: 3 });
def(38, 'torch', 'Torch', { render: R.TORCH, layer: L.CUTOUT, solid: false, opaque: false, emit: 14, hardness: 0, sound: 'wood' });
def(39, 'diamond_ore', 'Diamond Ore', { ...STONEY, hardness: 3, tier: 2 });
def(40, 'crafting_table', 'Crafting Table', { ...WOODY, hardness: 2.5, tex: { top: 'crafting_table_top', bottom: 'planks_oak', e: 'crafting_table_side', w: 'crafting_table_front', n: 'crafting_table_side', s: 'crafting_table_front' } });
def(41, 'furnace', 'Furnace', { ...STONEY, hardness: 3.5, facing: true, tex: { top: 'furnace_top', bottom: 'furnace_top', side: 'furnace_side', front: 'furnace_front' } });
def(42, 'furnace_on', 'Furnace', { ...STONEY, hardness: 3.5, facing: true, emit: 13, tex: { top: 'furnace_top', bottom: 'furnace_top', side: 'furnace_side', front: 'furnace_front_on' } });
def(43, 'redstone_ore', 'Redstone Ore', { ...STONEY, hardness: 3, tier: 2 });
def(44, 'ice', 'Ice', { layer: L.TRANS, opaque: false, opacity: 3, hardness: 0.5, tool: 'pickaxe', sound: 'glass', slip: 0.98 });
def(45, 'snow_block', 'Snow', { hardness: 0.2, tool: 'shovel', sound: 'snow', tex: 'snow' });
def(46, 'snow_layer', 'Snow Layer', { render: R.SNOW, opaque: false, hardness: 0.1, tool: 'shovel', sound: 'snow', tex: 'snow', replaceable: true });
def(47, 'clay', 'Clay', { hardness: 0.6, tool: 'shovel', sound: 'gravel' });
def(48, 'cactus', 'Cactus', { render: R.CACTUS, opaque: false, hardness: 0.4, sound: 'cloth', damage: 1, tex: { top: 'cactus_top', bottom: 'cactus_bottom', side: 'cactus_side' } });
def(49, 'glowstone', 'Glowstone', { emit: 15, hardness: 0.3, sound: 'glass' });
def(50, 'stonebrick', 'Stone Bricks', { ...STONEY, hardness: 1.5 });
def(51, 'log_birch', 'Birch Log', { ...WOODY, hardness: 2, tex: { top: 'log_birch_top', bottom: 'log_birch_top', side: 'log_birch' } });
def(52, 'log_spruce', 'Spruce Log', { ...WOODY, hardness: 2, tex: { top: 'log_spruce_top', bottom: 'log_spruce_top', side: 'log_spruce' } });
def(53, 'leaves_birch', 'Birch Leaves', { ...CUT, opacity: 1, hardness: 0.2, tint: 'birch', sound: 'grass', tex: 'leaves_birch' });
def(54, 'leaves_spruce', 'Spruce Leaves', { ...CUT, opacity: 1, hardness: 0.2, tint: 'spruce', sound: 'grass', tex: 'leaves_spruce' });
def(55, 'planks_birch', 'Birch Wood Planks', { ...WOODY, hardness: 2 });
def(56, 'planks_spruce', 'Spruce Wood Planks', { ...WOODY, hardness: 2 });
def(57, 'granite', 'Granite', { ...STONEY, hardness: 1.5 });
def(58, 'diorite', 'Diorite', { ...STONEY, hardness: 1.5 });
def(59, 'andesite', 'Andesite', { ...STONEY, hardness: 1.5 });
def(60, 'tallgrass', 'Grass', { ...PLANT, replaceable: true, tint: 'grass', tex: 'tallgrass' });
def(61, 'dead_bush', 'Dead Bush', { ...PLANT, replaceable: true, tex: 'dead_bush' });
def(62, 'stairs_oak', 'Oak Wood Stairs', { ...STAIRS, ...WOODY, needsTool: false, tex: 'planks_oak' });
def(63, 'stairs_cobble', 'Cobblestone Stairs', { ...STAIRS, tex: 'cobblestone' });
def(64, 'stairs_stonebrick', 'Stone Brick Stairs', { ...STAIRS, tex: 'stonebrick' });
def(65, 'stairs_brick', 'Brick Stairs', { ...STAIRS, tex: 'bricks' });
def(66, 'stairs_sandstone', 'Sandstone Stairs', { ...STAIRS, tex: { top: 'sandstone_top', bottom: 'sandstone_bottom', side: 'sandstone_side' } });
// next free id: 67

export const BLOCK_COUNT = 67;

// Raw cell value = id | data << 8
export const cell = (id, data = 0) => id | (data << 8);
export const cellId = (v) => v & 255;
export const cellData = (v) => v >> 8;

/** Face texture NAMES [E,W,U,D,S,N] for a block def. */
export function faceNames(b) {
  const t = b.tex;
  if (typeof t === 'string') return [t, t, t, t, t, t];
  if (t.all) return [t.all, t.all, t.all, t.all, t.all, t.all];
  const side = t.side || t.top;
  return [t.e || side, t.w || side, t.top || side, t.bottom || t.top || side, t.s || side, t.n || side];
}

/** Fill FACE_TEX / FRONT_TEX from a name -> layer index map (from textures.js). */
export function resolveTextures(ix) {
  for (const b of blocks) {
    if (!b) continue;
    const names = faceNames(b);
    for (let f = 0; f < 6; f++) {
      const layer = ix[names[f]];
      if (layer === undefined) throw new Error(`block ${b.name}: missing texture '${names[f]}'`);
      FACE_TEX[b.id * 6 + f] = layer;
    }
    if (b.facing) {
      const fr = ix[b.tex.front];
      if (fr === undefined) throw new Error(`block ${b.name}: missing front texture '${b.tex.front}'`);
      FRONT_TEX[b.id] = fr;
    }
  }
}

// ---- shapes (block-local coordinates 0..1): [x0,y0,z0,x1,y1,z1] ----
const FULL = [[0, 0, 0, 1, 1, 1]];
const NONE = [];

/** Collision boxes for a block cell. */
export function collisionBoxes(id, data) {
  switch (RENDER[id]) {
    case R.CUBE: return SOLID[id] ? FULL : NONE;
    case R.SLAB: return (data & 1) ? [[0, 0.5, 0, 1, 1, 1]] : [[0, 0, 0, 1, 0.5, 1]];
    case R.STAIRS: return stairBoxes(data);
    case R.SNOW: { const h = (data & 7) / 8; return h > 0 ? [[0, 0, 0, 1, h, 1]] : NONE; }
    case R.CACTUS: return [[0.0625, 0, 0.0625, 0.9375, 0.9375, 0.9375]];
    default: return NONE;
  }
}

/** Selection (outline / raycast) boxes. Liquids and air are not selectable. */
export function selectionBoxes(id, data) {
  switch (RENDER[id]) {
    case R.CUBE: return FULL;
    case R.SLAB: return collisionBoxes(id, data);
    case R.STAIRS: return stairBoxes(data);
    case R.SNOW: return [[0, 0, 0, 1, ((data & 7) + 1) / 8, 1]];
    case R.CACTUS: return [[0.0625, 0, 0.0625, 0.9375, 1, 0.9375]];
    case R.CROSS: return id === ID.tallgrass || id === ID.dead_bush || id === ID.sapling_oak
      ? [[0.1, 0, 0.1, 0.9, 0.8, 0.9]] : [[0.3, 0, 0.3, 0.7, 0.6, 0.7]];
    case R.TORCH: return [[0.4, 0, 0.4, 0.6, 0.6, 0.6]];
    default: return NONE;
  }
}

/** Stairs: data bits 0-1 = facing (tall side), bit 2 = upside down. */
export function stairBoxes(data) {
  const f = data & 3, flip = (data & 4) !== 0;
  const base = flip ? [0, 0.5, 0, 1, 1, 1] : [0, 0, 0, 1, 0.5, 1];
  const y0 = flip ? 0 : 0.5, y1 = flip ? 0.5 : 1;
  let step;
  if (f === 0) step = [0, y0, 0, 1, y1, 0.5];        // N: tall side at -Z
  else if (f === 1) step = [0.5, y0, 0, 1, y1, 1];   // E
  else if (f === 2) step = [0, y0, 0.5, 1, y1, 1];   // S
  else step = [0, y0, 0, 0.5, y1, 1];                // W
  return [base, step];
}

export const isLiquid = (id) => FLUID[id] === 1;
export const isSolidId = (id) => SOLID[id] === 1;
export const blockLabel = (id, data = 0) => (id === ID.wool ? WOOL_NAMES[data & 15] + ' Wool' : (blocks[id] ? blocks[id].label : '?'));
