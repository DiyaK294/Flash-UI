
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export interface Template {
    id: string;
    name: string;
    description: string;
    html: string;
    category: 'Cards' | 'Layouts' | 'Buttons' | 'Animations';
}

export const READY_MADE_TEMPLATES: Template[] = [
    {
        id: 'glass-card-01',
        name: 'Frost Glass Card',
        category: 'Cards',
        description: 'Sophisticated frosted glass effect with vibrant accent border.',
        html: `<div style="padding: 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 200px; display: flex; align-items: center; justify-content: center; font-family: sans-serif;">
  <div style="background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 24px; padding: 32px; width: 300px; color: white; box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);">
    <h3 style="margin-top: 0; font-weight: 700;">Quantum Fusion</h3>
    <p style="opacity: 0.8; line-height: 1.5; font-size: 0.9rem;">Harnessing the power of spectral transparency for modern interfaces.</p>
    <button style="background: white; color: #764ba2; border: none; padding: 12px 24px; border-radius: 12px; font-weight: 600; cursor: pointer; transition: 0.3s;">Explore</button>
  </div>
</div>`
    },
    {
        id: 'bento-grid-01',
        name: 'Modern Bento Grid',
        category: 'Layouts',
        description: 'Apple-inspired asymmetric layout for dashboards.',
        html: `<div style="padding: 20px; display: grid; grid-template-columns: repeat(3, 1fr); grid-auto-rows: 150px; gap: 12px; font-family: sans-serif; background: #fafafa;">
  <div style="grid-column: span 2; grid-row: span 2; background: #000; border-radius: 20px; padding: 24px; color: #fff; display: flex; flex-direction: column; justify-content: flex-end;">
    <h4 style="margin: 0; font-size: 1.5rem;">Hero Feature</h4>
    <p style="opacity: 0.6; margin: 4px 0 0;">Powerful analytics at scale.</p>
  </div>
  <div style="background: #e5e7eb; border-radius: 20px; padding: 20px;">
    <div style="font-weight: 600;">Stats</div>
    <div style="font-size: 2rem; font-weight: 800; margin-top: 8px;">94%</div>
  </div>
  <div style="background: #3b82f6; border-radius: 20px; padding: 20px; color: white;">
    <div style="font-weight: 600;">Sync</div>
    <div style="font-size: 0.8rem; margin-top: 4px;">Connected</div>
  </div>
  <div style="grid-column: span 1; background: #fff; border: 1px solid #e5e7eb; border-radius: 20px; padding: 20px;">
    <div style="width: 12px; height: 12px; border-radius: 50%; background: #ef4444; margin-bottom: 8px;"></div>
    <div style="font-weight: 600;">Alerts</div>
  </div>
</div>`
    },
    {
        id: 'kinetic-loader-01',
        name: 'Pulse Orbit Loader',
        category: 'Animations',
        description: 'Hypnotic CSS-only planetary motion loader.',
        html: `<div style="height: 300px; display: flex; align-items: center; justify-content: center; background: #000;">
  <style>
    @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    @keyframes pulse { 0%, 100% { transform: scale(0.8); opacity: 0.5; } 50% { transform: scale(1.2); opacity: 1; } }
    .orbit { position: relative; width: 100px; height: 100px; border: 1px solid rgba(255,255,255,0.1); border-radius: 50%; animation: rotate 4s linear infinite; }
    .planet { position: absolute; top: -5px; left: 50%; transform: translateX(-50%); width: 10px; height: 10px; background: #00f2fe; border-radius: 50%; box-shadow: 0 0 15px #00f2fe; }
    .sun { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 20px; height: 20px; background: #fff; border-radius: 50%; box-shadow: 0 0 20px #fff; animation: pulse 2s ease-in-out infinite; }
  </style>
  <div class="orbit">
    <div class="planet"></div>
    <div class="sun"></div>
  </div>
</div>`
    },
    {
        id: 'cyber-button-01',
        name: 'Glow Reveal Button',
        category: 'Buttons',
        description: 'Futuristic button with a hover-induced laser glow effect.',
        html: `<div style="padding: 50px; display: flex; justify-content: center; background: #0f172a;">
  <style>
    .cyber-btn {
      background: transparent; color: #38bdf8; border: 1px solid #38bdf8;
      padding: 16px 32px; font-family: monospace; font-size: 1.1rem;
      letter-spacing: 2px; text-transform: uppercase; cursor: pointer;
      position: relative; transition: 0.3s; overflow: hidden;
    }
    .cyber-btn:hover { background: #38bdf8; color: #0f172a; box-shadow: 0 0 20px #38bdf8; }
    .cyber-btn::before { content: ""; position: absolute; top: 0; left: -100%; width: 100%; height: 2px; background: #fff; transition: 0.5s; }
    .cyber-btn:hover::before { left: 100%; }
  </style>
  <button class="cyber-btn">Initialize System</button>
</div>`
    },
    {
        id: 'soft-neu-card',
        name: 'Soft Neumorphic Card',
        category: 'Cards',
        description: 'The classic "soft UI" aesthetic using layered shadows.',
        html: `<div style="padding: 60px; background: #e0e5ec; min-height: 200px; display: flex; align-items: center; justify-content: center; font-family: sans-serif;">
  <div style="width: 280px; height: 350px; background: #e0e5ec; border-radius: 40px; box-shadow: 20px 20px 60px #bec3c9, -20px -20px 60px #ffffff; padding: 40px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;">
    <div style="width: 80px; height: 80px; border-radius: 20px; background: #e0e5ec; box-shadow: inset 6px 6px 12px #bec3c9, inset -6px -6px 12px #ffffff; margin-bottom: 24px; display: flex; align-items: center; justify-content: center; color: #6d7c90; font-size: 2rem;">
      <i style="font-style: normal;">★</i>
    </div>
    <h3 style="color: #444; margin: 0;">Minimal Soft</h3>
    <p style="color: #6d7c90; font-size: 0.85rem; margin-top: 12px;">The art of negative space and soft shadows.</p>
  </div>
</div>`
    }
];
