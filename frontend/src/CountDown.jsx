import React, { useState, useEffect } from 'react';

const CountDown = ({ initialCooldownTime }) => {
    const [cooldownTime, setCooldownTime] = useState(initialCooldownTime);

    useEffect(() => {
        // 设置定时器
        const interval = setInterval(() => {
            setCooldownTime((prevTime) => {
                // 如果时间为零，则停止计时
                if (prevTime > 0) {
                    return prevTime - 1;
                }
                clearInterval(interval); // 清除定时器
                return prevTime;
            });
        }, 1000); // 每秒更新一次

        // 清理定时器
        return () => clearInterval(interval);
    }, []);

    return (
            <span style={{ color: "red" }}>{cooldownTime}s</span>
    );
};

export default CountDown;
