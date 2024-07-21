const axios = require('axios');

// 提交绑定函数
async function submitBinding(domains,site_id) {
    try {
        const response = await axios.post('https://tma.cfdash.bond/api/domain/bind', {
            domains,
            site_id,
        }, {
            headers: {
                'x-uid': '13688888888',
                'token': 'B2A6F6F9BDD51A22241E43C8398263F1',
                'Content-Type': 'application/json'
            }
        });

        if (response.data.code === 0) {
            const bind_id = response.data.data.id;
            return bind_id;
        } else {
            return -1;
        }
    } catch (error) {
        console.error('请求错误:', error);
    }
}

// 查询操作结果函数
async function queryBindingResult(bind_id) {
    try {
        const response = await axios.post(`https://tma.cfdash.bond/api/bind/${bind_id}`, {
            id: bind_id
        }, {
            headers: {
                'x-uid': '5952854430',
                'token': '8B8FD1A4E898C2D386886777F7B5FB18',
                'Content-Type': 'application/json'
            }
        });

        if (response.data.code === 0) {
            return response.data.data;
        }
        return false;
    } catch (error) {
        console.error('请求错误:', error);
    }
}


module.exports={
    submitBinding,
    queryBindingResult
}