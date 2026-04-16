export default function FlowDiagram({ steps }) {
  const allNodes = ['受付', ...steps, 'クローズ']

  return (
    <div className="overflow-x-auto py-4">
      <div className="flex items-center gap-0 min-w-max">
        {allNodes.map((node, index) => {
          const isFirst = index === 0
          const isLast = index === allNodes.length - 1
          const bgColor = isFirst
            ? 'bg-blue-500 text-white'
            : isLast
            ? 'bg-green-500 text-white'
            : 'bg-white border-2 border-blue-300 text-gray-800'

          return (
            <div key={index} className="flex items-center">
              {/* Node box */}
              <div
                className={`flex-shrink-0 rounded-lg px-3 py-2 text-center shadow-sm ${bgColor}`}
                style={{ minWidth: '110px', maxWidth: '150px' }}
              >
                <div className="text-xs font-semibold leading-tight">
                  {isFirst || isLast ? (
                    node
                  ) : (
                    <>
                      <span className="text-blue-500 font-bold text-sm">
                        {index}.{' '}
                      </span>
                      {node}
                    </>
                  )}
                </div>
              </div>

              {/* Arrow between nodes */}
              {index < allNodes.length - 1 && (
                <div className="flex-shrink-0 flex items-center">
                  <div className="w-6 h-0.5 bg-gray-400" />
                  <div
                    className="w-0 h-0"
                    style={{
                      borderTop: '6px solid transparent',
                      borderBottom: '6px solid transparent',
                      borderLeft: '8px solid #9ca3af',
                    }}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
