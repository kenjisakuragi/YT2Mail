
export default function AuthCodeError() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Authentication Error</h1>
            <p className="text-gray-600">
                ログイン処理中にエラーが発生しました。リンクが有効期限切れか、すでに使用されている可能性があります。
            </p>
            <a href="/login" className="mt-6 text-blue-600 hover:underline">
                ログインページに戻る
            </a>
        </div>
    )
}
