import { MandalaData } from '../types/mandala'

export interface TreeNode {
  id: string
  theme: string
  data: MandalaData
  parentId: string | null
  childIds: string[]
}

interface Props {
  nodes: Record<string, TreeNode>
  rootIds: string[]
  currentId: string | null
  onNodeClick: (id: string) => void
  onNodeDelete?: (id: string) => void
}

interface BranchProps {
  node: TreeNode
  nodes: Record<string, TreeNode>
  currentId: string | null
  onNodeClick: (id: string) => void
  onNodeDelete?: (id: string) => void
  isLast: boolean
}

function Branch({ node, nodes, currentId, onNodeClick, onNodeDelete, isLast }: BranchProps) {
  const isActive = node.id === currentId
  const hasChildren = node.childIds.length > 0

  return (
    <div className="tree-branch">
      <div className="tree-row">
        <span className={`tree-elbow ${isLast ? 'tree-elbow-last' : ''}`} />
        <button
          onClick={() => onNodeClick(node.id)}
          className={`tree-node-btn ${isActive ? 'tree-node-active' : ''}`}
          title={node.theme}
        >
          {node.theme}
        </button>
        {onNodeDelete && node.parentId !== null && (
          <button
            onClick={() => onNodeDelete(node.id)}
            className="tree-delete-btn"
            title="この枝を削除"
          >
            ×
          </button>
        )}
      </div>
      {hasChildren && (
        <div className={`tree-children ${isLast ? 'tree-children-last' : ''}`}>
          {node.childIds.map((childId, i) => (
            <Branch
              key={childId}
              node={nodes[childId]}
              nodes={nodes}
              currentId={currentId}
              onNodeClick={onNodeClick}
              onNodeDelete={onNodeDelete}
              isLast={i === node.childIds.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function HistoryTree({ nodes, rootIds, currentId, onNodeClick, onNodeDelete }: Props) {
  if (rootIds.length === 0) return null

  return (
    <div className="history-tree no-print">
      <h3 className="text-sm font-bold text-gray-600 mb-3 flex items-center gap-2">
        <span>🌳</span>
        <span>履歴ツリー</span>
        <span className="text-xs font-normal text-gray-400">
          （クリックで切替・セルクリックで枝を伸ばす）
        </span>
      </h3>
      <div className="tree-roots">
        {rootIds.map((id) => (
          <div key={id} className="tree-root-wrapper">
            <div className="tree-row">
              <button
                onClick={() => onNodeClick(id)}
                className={`tree-node-btn tree-root-btn ${id === currentId ? 'tree-node-active' : ''}`}
                title={nodes[id].theme}
              >
                ⊙ {nodes[id].theme}
              </button>
              {onNodeDelete && (
                <button
                  onClick={() => onNodeDelete(id)}
                  className="tree-delete-btn"
                  title="このツリーを削除"
                >
                  ×
                </button>
              )}
            </div>
            {nodes[id].childIds.length > 0 && (
              <div className="tree-children tree-children-last">
                {nodes[id].childIds.map((childId, i) => (
                  <Branch
                    key={childId}
                    node={nodes[childId]}
                    nodes={nodes}
                    currentId={currentId}
                    onNodeClick={onNodeClick}
                    onNodeDelete={onNodeDelete}
                    isLast={i === nodes[id].childIds.length - 1}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
