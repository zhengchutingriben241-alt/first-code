import React from 'react'

const MDXComponents: any = {
  pre: (props: any) => (
    <pre className="rounded-md bg-slate-900 text-white p-4 overflow-auto" {...props} />
  ),
  code: ({ className, children, ...props }: any) => {
    return (
      <code className={(className || '') + ' not-prose'} {...props}>
        {children}
      </code>
    )
  },
}

export default MDXComponents
