export class PrismaClient {
  user: any = {};
  board: any = {};
  list: any = {};
  card: any = {};
  $connect: any = () => Promise.resolve();
  $disconnect: any = () => Promise.resolve();
  $transaction: any = (fn: any) => fn(this);
}
