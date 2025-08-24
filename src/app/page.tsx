"use client";

import { useEffect } from "react";
import { registerBasics } from "@/figmaV3/components/registerBasics";
import ComponentEditor from "@/figmaV3/editor/ComponentEditor";

export default function Page() {
    useEffect(() => {
        registerBasics();
    }, []);
    return <ComponentEditor />;
}