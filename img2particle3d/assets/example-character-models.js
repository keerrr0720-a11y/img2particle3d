/*
  用 img2particle3d skill 实测：三视图（正面/侧面/背面）→ 程序化模型 → 粒子特效
  对象：头戴雏菊的圆土豆小鸡。仅用图元手工搭出有面积的封闭表面，供查看器按面积采样。
*/
(function () {
    function mesh(group, geometry, material, name, position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1]) {
        const item = new THREE.Mesh(geometry, material);
        item.name = name; item.position.set(...position); item.rotation.set(...rotation); item.scale.set(...scale);
        group.add(item); return item;
    }
    function ball(group, material, name, position, scale = [1, 1, 1], seg = 24) {
        return mesh(group, new THREE.SphereGeometry(1, seg, Math.max(12, seg - 8)), material, name, position, [0, 0, 0], scale);
    }
    function finalize(group, id, parts) {
        group.name = id;
        group.userData.sculptRuntime = { nodes: Object.fromEntries(group.children.filter(c => c.name).map(c => [c.name, c])), destructionGroups: parts };
        return group;
    }

    function createPotatoChick() {
        const group = new THREE.Group();
        const yellow = new THREE.MeshStandardMaterial({ color: 0xefcb78, roughness: 0.85, metalness: 0 });
        const brown  = new THREE.MeshStandardMaterial({ color: 0xb2794d, roughness: 0.82, metalness: 0 });
        const petal  = new THREE.MeshStandardMaterial({ color: 0xfcfbf6, roughness: 0.7, metalness: 0 });
        const gold   = new THREE.MeshStandardMaterial({ color: 0xe0a93c, roughness: 0.55, metalness: 0.1 });
        const green  = new THREE.MeshStandardMaterial({ color: 0x8cbe69, roughness: 0.75, metalness: 0 });
        const pink   = new THREE.MeshStandardMaterial({ color: 0xf2a79e, roughness: 0.85, metalness: 0 });
        const dark   = new THREE.MeshStandardMaterial({ color: 0x3a2a22, roughness: 0.6, metalness: 0 });

        // 土豆身体：车削一条从底到顶的轮廓（下宽上窄的梨形/蛋形）
        const profile = [
            [0.00, -1.25], [0.50, -1.22], [0.82, -1.00], [0.99, -0.60],
            [1.03, -0.15], [0.98, 0.30], [0.85, 0.70], [0.66, 1.02],
            [0.40, 1.26], [0.00, 1.40]
        ].map(([r, y]) => new THREE.Vector2(r, y));
        mesh(group, new THREE.LatheGeometry(profile, 56), yellow, 'body');

        // 两侧小手/翅膀（同色，略扁，向前微倾）
        ball(group, yellow, 'arm-left',  [ 0.98, -0.05, 0.12], [0.20, 0.46, 0.26]).rotation.z = -0.35;
        ball(group, yellow, 'arm-right', [-0.98, -0.05, 0.12], [0.20, 0.46, 0.26]).rotation.z =  0.35;

        // 前面两只棕脚（朝 +Z 前伸）
        ball(group, brown, 'foot-left',  [ 0.46, -1.16, 0.42], [0.34, 0.24, 0.52]);
        ball(group, brown, 'foot-right', [-0.46, -1.16, 0.42], [0.34, 0.24, 0.52]);

        // 背面小尾巴（棕，朝 -Z）
        ball(group, brown, 'tail', [0, -0.95, -0.72], [0.24, 0.22, 0.26]);

        // 脸：两只黑眼睛 + 两团粉腮红（正面特征）
        ball(group, dark, 'eye-left',  [ 0.34, 0.52, 0.90], [0.085, 0.11, 0.06], 16);
        ball(group, dark, 'eye-right', [-0.34, 0.52, 0.90], [0.085, 0.11, 0.06], 16);
        ball(group, pink, 'cheek-left',  [ 0.60, 0.30, 0.74], [0.17, 0.12, 0.07], 16);
        ball(group, pink, 'cheek-right', [-0.60, 0.30, 0.74], [0.17, 0.12, 0.07], 16);

        // 头顶雏菊：金色花心 + 一圈白花瓣 + 几片绿叶，整体微倾
        const daisy = new THREE.Group();
        daisy.position.set(0.18, 1.34, 0.06);
        daisy.rotation.set(-0.25, 0, 0.28);
        ball(daisy, gold, 'daisy-center', [0, 0, 0], [0.16, 0.16, 0.10], 18);
        const petals = 8;
        for (let i = 0; i < petals; i++) {
            const a = i / petals * Math.PI * 2;
            const px = Math.cos(a) * 0.30, py = Math.sin(a) * 0.30;
            const p = ball(daisy, petal, `petal-${i + 1}`, [px, py, 0.02], [0.20, 0.11, 0.05], 16);
            p.rotation.z = a;
        }
        for (let i = 0; i < 3; i++) {
            const a = (i / 3) * Math.PI * 2 + 0.5;
            const lf = ball(daisy, green, `leaf-${i + 1}`, [Math.cos(a) * 0.42, Math.sin(a) * 0.42, -0.02], [0.16, 0.09, 0.04], 14);
            lf.rotation.z = a;
        }
        group.add(daisy);

        return finalize(group, 'potato-chick', {
            body: ['body', 'arm-left', 'arm-right'],
            feet: ['foot-left', 'foot-right', 'tail'],
            face: ['eye-left', 'eye-right', 'cheek-left', 'cheek-right'],
            flower: daisy.children.map(c => c.name)
        });
    }

    window.InstrumentModels = {
        names: ['雏菊土豆'],
        create(index) { return createPotatoChick(); }
    };
})();
