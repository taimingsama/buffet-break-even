/** Pick three different nouns and randomize their order; no account identity semantics. */
export const NICKNAME_NOUNS = [
    '云朵','月亮','星星','太阳','银河','彩虹','雪花','山川',
    '森林','海浪','沙滩','溪流','岛屿','湖泊','竹林','花园',
    '布丁','奶茶','蛋糕','饼干','麻薯','饭团','年糕','吐司',
    '芝士','果冻','汤圆','寿司','火锅','披萨','冰糖','豆花',
    '熊猫','水獭','企鹅','海豹','鲸鱼','小鹿','松鼠','海豚',
    '绵羊','仓鼠','柴犬','白兔','狐狸','刺猬','树懒','考拉',
    '草莓','芒果','柚子','桃子','西瓜','葡萄','樱桃','椰子',
    '南瓜','栗子','核桃','燕麦','咖啡','可可','薄荷','茉莉'
] as const

export function generateNickname(random: () => number = Math.random): string {
    const pool: string[] = [...NICKNAME_NOUNS]
    const words: string[] = []
    for (let i = 0; i < 3; i++) {
        const index = Math.floor(random() * pool.length)
        words.push(pool.splice(index, 1)[0])
    }
    return words.join('')
}
