document.addEventListener("DOMContentLoaded", async () => {

    console.log("JS START");

    const character = document.getElementById("character");
    const characterText = document.getElementById("characterText");
    const furniture = document.getElementById("furniture");

    try {

        // =========================
        // โหลด FURNITURE SVG
        // =========================

        const furnitureResponse = await fetch("furniture.svg");

        if (!furnitureResponse.ok) {
            throw new Error("โหลด furniture.svg ไม่สำเร็จ");
        }

        const furnitureText = await furnitureResponse.text();

        furniture.innerHTML = furnitureText;

        console.log("FURNITURE LOADED");


        // =========================
        // โหลด CHARACTER SVG
        // =========================

        const response = await fetch("character.svg");

        if (!response.ok) {
            throw new Error("โหลด character.svg ไม่สำเร็จ");
        }

        const svgText = await response.text();

        character.innerHTML = svgText;

        console.log("SVG LOADED");


        // =========================
        // หา ELEMENT
        // =========================

        const svg = character.querySelector("svg");
        const leftHand = character.querySelector("#LEFTHAND");
        const head = character.querySelector("#HEAD");
        const face = character.querySelector("#FACE");
        const tree1 = character.querySelector("#TREE1");
        const tree2 = character.querySelector("#TREE2");

        console.log("SVG:", svg);
        console.log("LEFTHAND:", leftHand);
        console.log("HEAD:", head);
        console.log("FACE:", face);
        console.log("TREE1:", tree1);
        console.log("TREE2:", tree2);


        // =========================
        // ตรวจสอบ ELEMENT
        // =========================

        if (!svg || !leftHand || !head || !face) {
            console.error("ไม่พบ Element บางส่วนใน character.svg");
            return;
        }


        let canClick = true;


        // =========================
        // CLICK CHARACTER
        // =========================

        svg.addEventListener("click", () => {

            if (!canClick) {
                console.log("ยังไม่พร้อมกด");
                return;
            }

            canClick = false;


            // =========================
            // เปลี่ยนข้อความ
            // =========================

            characterText.style.opacity = "0";

            setTimeout(() => {

                characterText.textContent = "Let reading togetherr!!!";

                characterText.style.opacity = "1";

            }, 300);


            // =========================
            // LEFT HAND WAVE
            // =========================

            leftHand.animate(
                [
                    { transform: "translateX(0) rotate(0deg)" },
                    { transform: "translateX(-5px) rotate(-3deg)" },
                    { transform: "translateX(-100px) rotate(-6deg)" },
                    { transform: "translateX(130px) rotate(5deg)" },
                    { transform: "translateX(-7px) rotate(-3deg)" },
                    { transform: "translateX(0) rotate(0deg)" }
                ],
                {
                    duration: 1600,
                    easing: "ease-in-out",
                    fill: "none"
                }
            );


            // =========================
            // HEAD + FACE REACTION
            // =========================

            head.classList.remove("react");
            face.classList.remove("react");

            void head.offsetWidth;
            void face.offsetWidth;

            head.classList.add("react");
            face.classList.add("react");


            // =========================
            // กลับไป IDLE
            // =========================

            setTimeout(() => {

                head.classList.remove("react");
                face.classList.remove("react");

            }, 1700);


            // =========================
            // ครบ 2 วิ
            // กลับข้อความเดิม
            // และกดใหม่ได้
            // =========================

            setTimeout(() => {

                characterText.style.opacity = "0";

                setTimeout(() => {

                    characterText.textContent = "click me pleaseee";

                    characterText.style.opacity = "1";

                }, 300);


                canClick = true;

                console.log("READY!");

            }, 2000);

        });

    } catch (error) {

        console.error("โหลด SVG ไม่สำเร็จ:", error);

    }

});