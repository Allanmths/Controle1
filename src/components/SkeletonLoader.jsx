import React from 'react';

const SkeletonLoader = ({ count = 5, type = 'list', columns = 5 }) => {
    const renderSkeletons = () => {
        const skeletons = [];
        for (let i = 0; i < count; i++) {
            if (type === 'list') {
                skeletons.push(
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-100 rounded-md animate-pulse">
                        <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                        <div className="flex gap-2">
                            <div className="h-6 w-6 bg-gray-300 rounded"></div>
                            <div className="h-6 w-6 bg-gray-300 rounded"></div>
                        </div>
                    </div>
                );
            } else if (type === 'table') {
                skeletons.push(
                    <tr key={i} className="animate-pulse">
                        {/* Checkbox skeleton */}
                        <td className="p-4">
                            <div className="h-5 w-5 bg-gray-300 rounded"></div>
                        </td>
                        {/* Column skeletons */}
                        {[...Array(columns)].map((_, colIndex) => (
                            <td key={colIndex} className="py-3 px-4">
                                <div className="h-4 bg-gray-300 rounded"></div>
                            </td>
                        ))}
                        {/* Actions skeleton */}
                        <td className="py-3 px-4">
                            <div className="h-6 w-16 bg-gray-300 rounded"></div>
                        </td>
                    </tr>
                );
            }
        }
        return skeletons;
    };

    // If the type is 'table', return the rows directly inside a fragment
    // so they can be valid children of a <tbody> element.
    if (type === 'table') {
        return <>{renderSkeletons()}</>;
    }

    // For other types, wrap them in a div as before.
    return (
        <div className="space-y-3">
            {renderSkeletons()}
        </div>
    );
};

export default SkeletonLoader;
