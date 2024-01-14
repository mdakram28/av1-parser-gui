import { DataNode, DataNodeValue } from "../types/parser.types";
import { useCallback, useContext, useEffect, useState } from "react";
import { BitstreamExplorerContext, BitstreamSelectionContext } from "../bitstream/bitstream-explorer";
import { BitRange } from "../bitstream/range";
import { FormControlLabel, Switch } from "@mui/material";
import { useTraceUpdate } from "../react-util";


function ValueFormat({ value }: { value: DataNodeValue }) {
    if (typeof value == "string" || typeof value == "number") {
        return <>{value}</>
    } else if (Array.isArray(value)) {
        return <div style={{ display: "inline-block" }}>
            {'{'}
            {value.map((val, i) => <>
                <ValueFormat value={val} />
                {i != value.length - 1 && ", "}
                {(i + 1) % 8 == 0 && i != value.length - 1 && <>
                    <br />
                    &nbsp;
                </>}
            </>)}
            {'}'}
        </div>
    }
}

function DataTreeNode({ node, level = 0 }: { node: DataNode, level?: number }) {
    const [expanded, setExpanded] = useState(false);
    const { showHiddenSyntax } = useContext(BitstreamExplorerContext);
    const { setRanges } = useContext(BitstreamSelectionContext);


    const select = useCallback(() => {
        if (node.size == 0) return;
        const newRange = new BitRange(node.start, node.start + node.size);
        // if (ranges.length == 1 && ranges[0].equals(newRange)) return;
        setRanges([newRange]);
    }, [node, setRanges]);

    const toggleExpand = () => setExpanded(exp => !exp);
    const setFocus = (ev: any) => ev.target.focus();


    return <>
        <tr
            onFocus={select}
            onClick={setFocus}
            onDoubleClick={toggleExpand}
            tabIndex={0}
            onKeyDown={(ev: any) => {
                if (ev.key == "Enter" || ev.key == " ") {
                    setExpanded(exp => !exp);
                } else if (ev.key == "ArrowRight") {
                    setExpanded(true);
                } else if (ev.key == "ArrowLeft") {
                    setExpanded(false);
                } else if (ev.key == "ArrowDown") {
                    ev.target.nextSibling.focus();
                    ev.preventDefault();
                } else if (ev.key == "ArrowUp") {
                    ev.target.previousSibling.focus();
                    ev.preventDefault();
                }
            }}
        >
            <td>
                <div style={{display: "flex"}}>
                    <span className="tab-space" style={{ width: 25 * level }}></span>
                    {node.children?.length
                        ? <div
                            onClick={toggleExpand}
                            className={(expanded ? "expanded " : "") + "expand-btn"}
                        >⮞</div>
                        : <div className="expand-space" />
                    }
                    {node.title} {
                        node.value !== undefined && <>
                            &nbsp;&nbsp; = &nbsp; <span className="value"><ValueFormat value={node.value} /></span>
                        </>
                    }
                </div>
            </td>
            <td>{node.start}</td>
            <td>{node.size}</td>
        </tr>
        {expanded && node.children?.length &&
            node.children.filter(child => showHiddenSyntax || !child.hidden).map(childNode =>
                <DataTreeNode key={childNode.key} node={childNode} level={level + 1} />
            )
        }
    </>
}

export function SyntaxTable({ }: {}
) {
    const ctx = useContext(BitstreamExplorerContext);
    useTraceUpdate(ctx);
    const { syntax: root, showHiddenSyntax, setShowHiddenSyntax } = ctx;

    console.log("Syntax table rendered");

    if (!root.children) {
        return <>No data</>
    }

    return <div style={{ flex: "1 1 auto", height: 0, overflowY: "auto", width: "100%", display: "flex", flexDirection: "column" }}>
        <div className="toolbar">
            <a className="toolbar-item" onClick={(ev: any) => {
                const menu: HTMLElement = ev.target.getElementsByClassName("toolbar-menu")[0];
                if (!menu) return;
                menu.classList.toggle("visible");
                if (menu.classList.contains("visible")) {
                    const closeListener = (ev: any) => {
                        if (!menu.contains(ev.target)) {
                            menu.classList.remove("visible");
                            document.removeEventListener("click", closeListener);
                        }
                    };
                    setTimeout(() => document.addEventListener("click", closeListener), 0);
                }
            }}>
                ⚙
                <div className="toolbar-menu">
                    <div className="toolbar-item">

                        <span style={{ flex: 1 }}></span>
                        <FormControlLabel control={
                            <Switch value={showHiddenSyntax} onChange={(ev) => setShowHiddenSyntax(ev.target.checked)} />
                        } label="Show hidden syntax" />
                    </div>
                </div>
            </a>
        </div>
        <div style={{ flex: "1 1 auto", height: 0, overflowY: "auto", width: "100%" }}>
            <table
                className="syntax-table"
                cellSpacing={0}
            // disableSelection
            // expanded={expanded}
            // onNodeToggle={(ev: any, nodeIds: string[]) => {
            //     setExpanded(nodeIds);
            // }}
            // onNodeSelect={(event, nodeIds) => onSelect([nodeIds])}
            // onNodeFocus={(event, nodeId) => {
            //     console.log(nodeId);
            //     const node = syntaxById[nodeId];
            //     if (!node || node.size == 0) return;
            //     const newRange = new BitRange(node.start, node.start+node.size);
            //     if (ranges.length == 1 && ranges[0].equals(newRange)) return;
            //     setRanges([newRange]);
            // }}
            >
                <thead>
                    <tr>
                        <th></th>
                        <th>Start</th>
                        <th>Size</th>
                    </tr>
                </thead>
                <tbody>
                    <DataTreeNode node={root}></DataTreeNode>
                </tbody>
            </table></div>
    </div>
}