"use client"
import { ReactFlowProvider } from "reactflow"

export default function ReactFlowContextProvider({ children }) {
  return <ReactFlowProvider>{children}</ReactFlowProvider>
}
