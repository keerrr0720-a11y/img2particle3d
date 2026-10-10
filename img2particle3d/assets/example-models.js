/*
  example-models.js — 粒子查看器的模型层示例
  ============================================================
  接口契约（particle-viewer.html 依赖它）：
      window.InstrumentModels = {
          names:  ['名称1', '名称2', ...],   // 底部按钮 + 名称读出 + 切换用
          create(index) { ... }              // 返回一个 THREE.Group（程序化模型）
      };
  - create(index) 必须返回 THREE.Group；组内每个可见部件都应是一个带
    geometry.attributes.position 的 Mesh（粒子按三角面积在其表面采样）。
  - 每个 Mesh 的 material.color 决定该处粒子的固有色（会被 uTint 轻微覆盖）。
  - 模型尺寸随意：查看器会按最长边归一化到 NORMALIZE_SIZE，无需自己缩放。

  三视图 → 模型：用现成的 img2threejs skill 生成 object-sculpt-spec.json，
  再把其中的部件（frame/strings/cords…）逐个翻译成下面的图元调用即可。
  下面 createKonghou() 就是"竖箜篌"三视图对应的成品建模，可直接参考其写法。
*/
(function () {
    // ---------- 图元辅助（照抄自《万象和鸣》instrument-models.js） ----------
    function mesh(group, geometry, material, name, position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1]) {
        const item = new THREE.Mesh(geometry, material);
        item.name = name;
        item.position.set(...position);
        item.rotation.set(...rotation);
        item.scale.set(...scale);
        item.castShadow = true; item.receiveShadow = true;
        group.add(item);
        return item;
    }
    function cylinder(group, radius, length, material, name, position = [0, 0, 0], rotation = [0, 0, 0], radial = 20) {
        return mesh(group, new THREE.CylinderGeometry(radius, radius, length, radial, 1, false), material, name, position, rotation);
    }
    function tube(group, points, radius, material, name, segments = 36) {
        const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
        return mesh(group, new THREE.TubeGeometry(curve, segments, radius, 8, false), material, name);
    }
    function rodBetween(group, start, end, radius, material, name) {
        const a = new THREE.Vector3(...start), b = new THREE.Vector3(...end);
        const center = a.clone().add(b).multiplyScalar(0.5);
        const direction = b.clone().sub(a);
        const item = cylinder(group, radius, direction.length(), material, name, center.toArray());
        item.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
        return item;
    }
    function torus(group, major, minor, material, name, position = [0, 0, 0], rotation = [Math.PI / 2, 0, 0]) {
        return mesh(group, new THREE.TorusGeometry(major, minor, 8, 30), material, name, position, rotation);
    }
    function finalize(group, id, parts) {
        group.name = id;
        group.userData.sculptRuntime = {
            nodes: Object.fromEntries(group.children.filter(c => c.name).map(c => [c.name, c])),
            destructionGroups: parts
        };
        return group;
    }

    // ---------- 竖箜篌（对应三视图：正面 / 左侧 / 右侧） ----------
    function createKonghou() {
        const group = new THREE.Group();
        const darkFrame = new THREE.MeshPhysicalMaterial({ color: 0x17100f, roughness: 0.38, metalness: 0.01, clearcoat: 0.42 });
        const creamLacquer = new THREE.MeshPhysicalMaterial({ color: 0xe9dfc6, roughness: 0.3, metalness: 0.01, clearcoat: 0.48 });
        const warmWood = new THREE.MeshStandardMaterial({ color: 0x986335, roughness: 0.5, metalness: 0.01 });
        const stringMaterial = new THREE.MeshStandardMaterial({ color: 0xcaa870, roughness: 0.44, metalness: 0.08 });
        const goldPeg = new THREE.MeshPhysicalMaterial({ color: 0xc49743, roughness: 0.32, metalness: 0.22, clearcoat: 0.3 });
        const pearl = new THREE.MeshPhysicalMaterial({ color: 0xdedbd3, roughness: 0.22, metalness: 0.04, clearcoat: 0.48 });
        const leaf = new THREE.MeshStandardMaterial({ color: 0x4b281e, roughness: 0.5, metalness: 0 });
        const rope = new THREE.MeshStandardMaterial({ color: 0xb69a69, roughness: 0.84, metalness: 0 });

        const outerPoints = [[-1.48, -0.42, -0.08], [-1.48, 0.48, -0.08], [-1.22, 1.5, -0.08], [-0.68, 2.38, -0.08], [0.08, 2.88, -0.08], [1.02, 2.72, -0.08]];
        const outerCurve = new THREE.CatmullRomCurve3(outerPoints.map(p => new THREE.Vector3(...p)));
        mesh(group, new THREE.TubeGeometry(outerCurve, 72, 0.31, 12, false), darkFrame, 'arched-backbone');
        tube(group, outerPoints.map(([x, y]) => [x, y, 0.1]), 0.255, creamLacquer, 'ivory-floral-arc', 72);

        const railPoints = [[-1.25, -0.32, 0.18], [-1.24, 0.53, 0.18], [-1.0, 1.4, 0.18], [-0.5, 2.18, 0.18], [0.18, 2.62, 0.18], [1.02, 2.53, 0.18]];
        const railCurve = new THREE.CatmullRomCurve3(railPoints.map(p => new THREE.Vector3(...p)));
        mesh(group, new THREE.TubeGeometry(railCurve, 72, 0.105, 10, false), warmWood, 'inner-string-rail');

        mesh(group, new THREE.BoxGeometry(0.31, 1.48, 0.42), darkFrame, 'vertical-foot', [-1.47, -1.77, 0]);
        mesh(group, new THREE.BoxGeometry(0.42, 0.38, 0.5), darkFrame, 'crossbar-joint', [-1.31, -1.15, 0]);
        tube(group, [[-1.46, -1.03, 0], [-1.57, -0.72, 0], [-1.45, -0.43, 0]], 0.13, darkFrame, 'upper-column-shoulder', 18);

        rodBetween(group, [-1.23, -1.16, 0.08], [1.82, -0.91, 0.08], 0.11, warmWood, 'horizontal-string-bar');
        cylinder(group, 0.14, 0.28, darkFrame, 'bar-end-cap', [1.94, -0.9, 0.08], [0, 0, Math.PI / 2], 18);

        const stringCount = 20;
        for (let i = 0; i < stringCount; i++) {
            const t = i / (stringCount - 1);
            const topPoint = railCurve.getPoint(0.035 + t * 0.94);
            const bottom = [-1.15 + t * 2.85, -1.15 + t * 0.23, 0.18];
            rodBetween(group, topPoint.toArray(), bottom, 0.01, stringMaterial, `string-${i + 1}`);
            mesh(group, new THREE.SphereGeometry(0.035, 9, 7), goldPeg, `tuning-peg-${i + 1}`, topPoint.toArray());
            const barX = bottom[0];
            torus(group, 0.125, 0.018, rope, `bar-wrap-${i + 1}`, [barX, bottom[1], 0.08], [0, Math.PI / 2, 0]);
            const sway = (i % 3 - 1) * 0.08;
            tube(group, [[barX, bottom[1] - 0.04, 0.04], [barX + sway, -1.62, 0.05], [barX - sway * 0.5, -2.18 + (i % 4) * 0.05, 0.03]], 0.022, rope, `hanging-cord-${i + 1}`, 18);
            mesh(group, new THREE.ConeGeometry(0.055, 0.17, 8), rope, `cord-tassel-${i + 1}`, [barX - sway * 0.5, -2.25 + (i % 4) * 0.05, 0.03]);
        }

        const flowerT = [0.08, 0.25, 0.43, 0.61, 0.79, 0.94];
        flowerT.forEach((t, index) => {
            const center = outerCurve.getPoint(t); center.z = 0.36;
            mesh(group, new THREE.SphereGeometry(0.065, 10, 8), goldPeg, `arc-flower-center-${index + 1}`, center.toArray());
            for (let k = 0; k < 6; k++) {
                const angle = k / 6 * Math.PI * 2;
                mesh(group, new THREE.SphereGeometry(0.09, 10, 8), index % 2 ? pearl : leaf, `arc-flower-${index + 1}-petal-${k + 1}`, [center.x + Math.cos(angle) * 0.13, center.y + Math.sin(angle) * 0.13, 0.34], [0, 0, 0], [1.35, 0.72, 0.34]);
            }
        });
        tube(group, [[-1.5, -0.22, 0.34], [-1.28, 0.62, 0.35], [-0.92, 1.42, 0.35], [-0.35, 2.16, 0.35], [0.48, 2.63, 0.34]], 0.025, leaf, 'arc-vine', 48);
        for (let i = 0; i < 5; i++) {
            mesh(group, new THREE.SphereGeometry(0.045, 9, 7), i % 2 ? pearl : goldPeg, `column-inlay-${i + 1}`, [-1.47, -2.25 + i * 0.27, 0.25], [0, 0, 0], [1.3, 0.8, 0.35]);
        }

        return finalize(group, 'konghou', {
            frame: ['arched-backbone', 'ivory-floral-arc', 'inner-string-rail', 'vertical-foot', 'crossbar-joint', 'horizontal-string-bar'],
            strings: Array.from({ length: stringCount }, (_, i) => `string-${i + 1}`),
            cords: Array.from({ length: stringCount }, (_, i) => `hanging-cord-${i + 1}`)
        });
    }

    // ---------- 最小示例：一颗心（演示"如何添加你自己的对象"） ----------
    function createHeart() {
        const group = new THREE.Group();
        const red = new THREE.MeshStandardMaterial({ color: 0xd23a5b, roughness: 0.4, metalness: 0.1 });
        // 用参数化心形曲线挤出成管状，粒子会沿其表面采样
        const pts = [];
        for (let i = 0; i <= 60; i++) {
            const t = i / 60 * Math.PI * 2;
            const x = 16 * Math.pow(Math.sin(t), 3);
            const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
            pts.push([x * 0.09, y * 0.09, 0]);
        }
        tube(group, pts, 0.28, red, 'heart-outline', 96);
        return finalize(group, 'heart', { body: ['heart-outline'] });
    }

    // ---------- 导出接口 ----------
    const factories = [createKonghou, createHeart];
    window.InstrumentModels = {
        names: ['竖箜篌', '心'],
        create(index) { return factories[index](); }
    };
})();
