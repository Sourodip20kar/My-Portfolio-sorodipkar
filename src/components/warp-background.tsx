import { Warp, type WarpProps } from '@paper-design/shaders-react';

export default function WarpBackground(props: WarpProps) {
    const combinedProps = {
        style: { width: '100%', height: '100%' }, 
        ...props,
    };

    return <Warp {...combinedProps} />;
}